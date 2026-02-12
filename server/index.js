import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  getPortfolio,
  updateCash,
  getHoldings,
  getHolding,
  upsertHolding,
  getTrades,
  addTrade,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  resetPortfolio,
  getAlerts,
  markAlertRead,
  markAllAlertsRead
} from './database.js';
import {
  getQuote,
  getQuotes,
  scanMarket,
  searchStocks,
  DEFAULT_STOCKS
} from './marketService.js';
import { startPriceMonitor } from './priceMonitor.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// =====================
// MARKET DATA ENDPOINTS
// =====================

// Scan market for trading opportunities
app.get('/api/market/scan', async (req, res) => {
  try {
    const watchlist = getWatchlist();
    const symbols = watchlist.length > 0 ? watchlist : DEFAULT_STOCKS;
    const results = await scanMarket(symbols);
    res.json({ success: true, data: results, timestamp: Date.now() });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get fresh quote for a single stock (for trade execution)
app.get('/api/market/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getQuote(symbol.toUpperCase());
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }
    res.json({ success: true, data: quote, timestamp: Date.now() });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quotes for multiple stocks
app.post('/api/market/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ success: false, error: 'Symbols must be an array' });
    }
    const quotes = await getQuotes(symbols.map(s => s.toUpperCase()));
    res.json({ success: true, data: quotes, timestamp: Date.now() });
  } catch (error) {
    console.error('Quotes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search for stocks
app.get('/api/market/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query required' });
    }
    const results = await searchStocks(q);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// PORTFOLIO ENDPOINTS
// =====================

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = getPortfolio();
    const holdings = getHoldings();

    // Get current prices for holdings
    if (holdings.length > 0) {
      const symbols = holdings.map(h => h.symbol);
      const quotes = await getQuotes(symbols);
      const priceMap = Object.fromEntries(quotes.map(q => [q.symbol, q]));

      const holdingsWithPrices = holdings.map(h => {
        const quote = priceMap[h.symbol];
        const currentPrice = quote?.price || h.avg_cost;
        const marketValue = h.shares * currentPrice;
        const costBasis = h.shares * h.avg_cost;
        const unrealizedPL = marketValue - costBasis;
        const unrealizedPLPercent = (unrealizedPL / costBasis) * 100;

        return {
          ...h,
          currentPrice,
          marketValue,
          costBasis,
          unrealizedPL,
          unrealizedPLPercent,
          change: quote?.change,
          changePercent: quote?.changePercent,
          name: quote?.name
        };
      });

      const totalMarketValue = holdingsWithPrices.reduce((sum, h) => sum + h.marketValue, 0);
      const totalCostBasis = holdingsWithPrices.reduce((sum, h) => sum + h.costBasis, 0);
      const totalUnrealizedPL = totalMarketValue - totalCostBasis;
      const totalEquity = portfolio.cash + totalMarketValue;

      res.json({
        success: true,
        data: {
          cash: portfolio.cash,
          holdings: holdingsWithPrices,
          totalMarketValue,
          totalCostBasis,
          totalUnrealizedPL,
          totalUnrealizedPLPercent: totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0,
          totalEquity,
          timestamp: Date.now()
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          cash: portfolio.cash,
          holdings: [],
          totalMarketValue: 0,
          totalCostBasis: 0,
          totalUnrealizedPL: 0,
          totalUnrealizedPLPercent: 0,
          totalEquity: portfolio.cash,
          timestamp: Date.now()
        }
      });
    }
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trade history
app.get('/api/portfolio/trades', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const trades = getTrades(limit);
    res.json({ success: true, data: trades });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset portfolio
app.post('/api/portfolio/reset', (req, res) => {
  try {
    const portfolio = resetPortfolio();
    res.json({
      success: true,
      data: {
        cash: portfolio.cash,
        holdings: [],
        totalMarketValue: 0,
        totalEquity: portfolio.cash,
        message: 'Portfolio reset to $100,000'
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// TRADING ENDPOINTS
// =====================

// Execute a BUY order - fetches fresh price at execution time
app.post('/api/trade/buy', async (req, res) => {
  try {
    const { symbol, shares, takeProfit: requestedTakeProfit, stopLoss: requestedStopLoss } = req.body;

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid symbol and positive share count required'
      });
    }

    // CRITICAL: Fetch fresh, live price at execution time
    const quote = await getQuote(symbol.toUpperCase());
    if (!quote || !quote.price) {
      return res.status(400).json({
        success: false,
        error: 'Unable to fetch current price. Market may be closed.'
      });
    }

    const price = quote.price;
    const total = price * shares;

    // Check if user has enough cash
    const portfolio = getPortfolio();
    if (portfolio.cash < total) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. Required: $${total.toFixed(2)}, Available: $${portfolio.cash.toFixed(2)}`
      });
    }

    // Use provided targets or calculate defaults (+8% profit, -4% stop loss)
    const takeProfit = requestedTakeProfit || price * 1.08;
    const stopLoss = requestedStopLoss || price * 0.96;

    // Update cash
    updateCash(portfolio.cash - total);

    // Update holdings (calculate new average cost if adding to position)
    const existingHolding = getHolding(symbol.toUpperCase());
    let newShares, newAvgCost;

    if (existingHolding) {
      const existingValue = existingHolding.shares * existingHolding.avg_cost;
      const newValue = shares * price;
      newShares = existingHolding.shares + shares;
      newAvgCost = (existingValue + newValue) / newShares;
    } else {
      newShares = shares;
      newAvgCost = price;
    }

    // Store holding with TP/SL for automatic monitoring
    upsertHolding(symbol.toUpperCase(), newShares, newAvgCost, takeProfit, stopLoss);

    // Record trade
    const trade = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      action: 'BUY',
      shares,
      price,
      total,
      take_profit: takeProfit,
      stop_loss: stopLoss
    };
    addTrade(trade);

    res.json({
      success: true,
      data: {
        trade,
        message: `Bought ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)}`,
        newCashBalance: portfolio.cash - total,
        tradingPlan: {
          entry: price,
          takeProfit,
          stopLoss
        }
      }
    });
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute a SELL order
app.post('/api/trade/sell', async (req, res) => {
  try {
    const { symbol, shares } = req.body;

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid symbol and positive share count required'
      });
    }

    // Check if user has the holding
    const holding = getHolding(symbol.toUpperCase());
    if (!holding) {
      return res.status(400).json({
        success: false,
        error: `You don't own any shares of ${symbol.toUpperCase()}`
      });
    }

    if (holding.shares < shares) {
      return res.status(400).json({
        success: false,
        error: `Insufficient shares. You own ${holding.shares} shares of ${symbol.toUpperCase()}`
      });
    }

    // CRITICAL: Fetch fresh, live price at execution time
    const quote = await getQuote(symbol.toUpperCase());
    if (!quote || !quote.price) {
      return res.status(400).json({
        success: false,
        error: 'Unable to fetch current price. Market may be closed.'
      });
    }

    const price = quote.price;
    const total = price * shares;

    // Update cash
    const portfolio = getPortfolio();
    updateCash(portfolio.cash + total);

    // Update holdings
    const newShares = holding.shares - shares;
    upsertHolding(symbol.toUpperCase(), newShares, holding.avg_cost);

    // Calculate realized P&L
    const costBasis = shares * holding.avg_cost;
    const realizedPL = total - costBasis;
    const realizedPLPercent = (realizedPL / costBasis) * 100;

    // Record trade
    const trade = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      action: 'SELL',
      shares,
      price,
      total
    };
    addTrade(trade);

    res.json({
      success: true,
      data: {
        trade,
        message: `Sold ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)}`,
        newCashBalance: portfolio.cash + total,
        realizedPL,
        realizedPLPercent
      }
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// WATCHLIST ENDPOINTS
// =====================

// Get watchlist
app.get('/api/watchlist', (req, res) => {
  try {
    const watchlist = getWatchlist();
    res.json({ success: true, data: watchlist });
  } catch (error) {
    console.error('Watchlist error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to watchlist
app.post('/api/watchlist', (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol required' });
    }
    addToWatchlist(symbol);
    res.json({ success: true, data: getWatchlist() });
  } catch (error) {
    console.error('Watchlist add error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove from watchlist
app.delete('/api/watchlist/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    removeFromWatchlist(symbol);
    res.json({ success: true, data: getWatchlist() });
  } catch (error) {
    console.error('Watchlist remove error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// ALERTS ENDPOINTS
// =====================

// Get all unread alerts
app.get('/api/alerts', (req, res) => {
  try {
    const includeRead = req.query.all === 'true';
    const alerts = getAlerts(includeRead);
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark a single alert as read
app.post('/api/alerts/:id/read', (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alert = markAlertRead(alertId);
    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all alerts as read
app.post('/api/alerts/read-all', (req, res) => {
  try {
    markAllAlertsRead();
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Mark all alerts read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// START SERVER
// =====================

app.listen(PORT, () => {
  console.log(`🚀 Trading Server running on http://localhost:${PORT}`);
  console.log(`📈 Market Scanner API: http://localhost:${PORT}/api/market/scan`);
  console.log(`💼 Portfolio API: http://localhost:${PORT}/api/portfolio`);
  console.log(`🔔 Alerts API: http://localhost:${PORT}/api/alerts`);

  // Start the price monitoring service for auto TP/SL execution
  startPriceMonitor();
});
