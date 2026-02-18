import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
  markAllAlertsRead,
  addCommission,
  addTax,
  addRealizedPL,
  getFeesSummary
} from './database.js';

// Broker & Tax Constants (IBI Israel)
const MIN_COMMISSION = 7.5;  // $7.50 minimum per trade
const TAX_RATE = 0.25;       // 25% Israel capital gains tax
import {
  getQuote,
  getQuotes,
  scanMarket,
  searchStocks,
  analyzeStock,
  getCompanyInfo,
  DEFAULT_STOCKS
} from './marketService.js';
import { startPriceMonitor } from './priceMonitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// =====================
// MARKET DATA ENDPOINTS
// =====================

// Scan market for trading opportunities
app.get('/api/market/scan', async (req, res) => {
  try {
    const watchlist = await getWatchlist();
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

// Analyze a single stock (full battle plan analysis)
app.get('/api/market/analyze/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const analysis = await analyzeStock(symbol.toUpperCase());
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Unable to analyze stock' });
    }
    res.json({ success: true, data: analysis, timestamp: Date.now() });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company info (profile + news) from Finnhub
app.get('/api/market/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const info = await getCompanyInfo(symbol.toUpperCase());
    res.json({ success: true, data: info, timestamp: Date.now() });
  } catch (error) {
    console.error('Company info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// PORTFOLIO ENDPOINTS
// =====================

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    const holdings = await getHoldings();

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

      const feesSummary = await getFeesSummary();
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
          feesSummary,
          timestamp: Date.now()
        }
      });
    } else {
      const feesSummary = await getFeesSummary();
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
          feesSummary,
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
app.get('/api/portfolio/trades', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const trades = await getTrades(limit);
    res.json({ success: true, data: trades });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset portfolio
app.post('/api/portfolio/reset', async (req, res) => {
  try {
    const portfolio = await resetPortfolio();
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

    // Calculate commission (0.1% with $7.50 minimum)
    const commission = Math.max(MIN_COMMISSION, total * 0.001);

    // Check if user has enough cash (including commission)
    const portfolio = await getPortfolio();
    const totalWithCommission = total + commission;
    if (portfolio.cash < totalWithCommission) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. Required: $${totalWithCommission.toFixed(2)} (incl. $${commission.toFixed(2)} fee), Available: $${portfolio.cash.toFixed(2)}`
      });
    }

    // Use provided targets or calculate defaults (+8% profit, -4% stop loss)
    const takeProfit = requestedTakeProfit || price * 1.08;
    const stopLoss = requestedStopLoss || price * 0.96;

    // Update cash (deduct trade amount + commission)
    await updateCash(portfolio.cash - totalWithCommission);

    // Track commission
    await addCommission(commission);

    // Update holdings (calculate new average cost if adding to position)
    const existingHolding = await getHolding(symbol.toUpperCase());
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
    await upsertHolding(symbol.toUpperCase(), newShares, newAvgCost, takeProfit, stopLoss);

    // Record trade with commission
    const trade = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      action: 'BUY',
      shares,
      price,
      total,
      commission,
      take_profit: takeProfit,
      stop_loss: stopLoss
    };
    await addTrade(trade);

    res.json({
      success: true,
      data: {
        trade,
        message: `Bought ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)} (Fee: $${commission.toFixed(2)})`,
        newCashBalance: portfolio.cash - totalWithCommission,
        commission,
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
    const holding = await getHolding(symbol.toUpperCase());
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

    // Calculate commission (0.1% with $7.50 minimum)
    const commission = Math.max(MIN_COMMISSION, total * 0.001);

    // Calculate realized P&L (before commission and tax)
    const costBasis = shares * holding.avg_cost;
    const grossPL = total - costBasis;

    // Calculate tax (only on profit after commission)
    const profitAfterCommission = grossPL - commission;
    const taxAmount = profitAfterCommission > 0 ? profitAfterCommission * TAX_RATE : 0;

    // Net proceeds = Sale total - Commission - Tax
    const netProceeds = total - commission - taxAmount;

    // Update cash (add net proceeds)
    const portfolio = await getPortfolio();
    await updateCash(portfolio.cash + netProceeds);

    // Track commission and tax
    await addCommission(commission);
    if (taxAmount > 0) {
      await addTax(taxAmount);
    }
    await addRealizedPL(grossPL);

    // Update holdings
    const newShares = holding.shares - shares;
    await upsertHolding(symbol.toUpperCase(), newShares, holding.avg_cost);

    // Calculate net realized P&L (after fees and tax)
    const netRealizedPL = grossPL - commission - taxAmount;
    const realizedPLPercent = (grossPL / costBasis) * 100;

    // Record trade with all fee details
    const trade = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      action: 'SELL',
      shares,
      price,
      total,
      commission,
      taxAmount,
      grossPL,
      netRealizedPL
    };
    await addTrade(trade);

    res.json({
      success: true,
      data: {
        trade,
        message: `Sold ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)}`,
        newCashBalance: portfolio.cash + netProceeds,
        grossPL,
        commission,
        taxAmount,
        netRealizedPL,
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
app.get('/api/watchlist', async (req, res) => {
  try {
    const watchlist = await getWatchlist();
    res.json({ success: true, data: watchlist });
  } catch (error) {
    console.error('Watchlist error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to watchlist
app.post('/api/watchlist', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol required' });
    }
    await addToWatchlist(symbol);
    res.json({ success: true, data: await getWatchlist() });
  } catch (error) {
    console.error('Watchlist add error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove from watchlist
app.delete('/api/watchlist/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    await removeFromWatchlist(symbol);
    res.json({ success: true, data: await getWatchlist() });
  } catch (error) {
    console.error('Watchlist remove error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// ALERTS ENDPOINTS
// =====================

// Get all unread alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const includeRead = req.query.all === 'true';
    const alerts = await getAlerts(includeRead);
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark a single alert as read
app.post('/api/alerts/:id/read', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alert = await markAlertRead(alertId);
    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all alerts as read
app.post('/api/alerts/read-all', async (req, res) => {
  try {
    await markAllAlertsRead();
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Mark all alerts read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================
// CATCH-ALL FOR SPA ROUTING
// =====================

// Serve React app for any non-API routes (must be after all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// =====================
// START SERVER
// =====================

app.listen(PORT, () => {
  console.log(`🚀 Trading Server running on http://localhost:${PORT}`);
  console.log(`📈 Market Scanner API: http://localhost:${PORT}/api/market/scan`);
  console.log(`💼 Portfolio API: http://localhost:${PORT}/api/portfolio`);
  console.log(`🔔 Alerts API: http://localhost:${PORT}/api/alerts`);
  console.log(`🌐 Static files served from: ${clientBuildPath}`);

  // Start the price monitoring service for auto TP/SL execution
  startPriceMonitor();
});
