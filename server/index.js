// Load .env before anything else imports a module that reads process.env.
// This used to live only in marketService.js, which is imported after
// firestore.js - so credentials were read before .env had been applied and it
// only worked because the deployment injects real environment variables.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  getPortfolio,
  adjustCash,
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

// Broker & tax math lives in one place - see tradeMath.js
import {
  calculateBuy,
  calculateSell,
  buildSellTrade,
  buyCommissionPerShareFor,
  FALLBACK_TAKE_PROFIT_PCT,
  FALLBACK_STOP_LOSS_PCT
} from './tradeMath.js';
import {
  getQuote,
  getFreshQuote,
  getQuotes,
  getDailyBars,
  scanMarket,
  searchStocks,
  analyzeStock,
  getCompanyInfo,
  DEFAULT_STOCKS
} from './marketService.js';
import {
  getLatestRecommendation,
  getPerformanceStats,
  evaluateOutcomes
} from './recommendationLog.js';
import { startPriceMonitor, stopPriceMonitor } from './priceMonitor.js';
import { requireAuth, loginHandler } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Railway terminates TLS in front of this process, so without this req.ip is
// the proxy's address and the login rate limiter would treat every visitor as
// the same client.
app.set('trust proxy', 1);

// CORS: an allowlist, not a wildcard. With no auth and `cors()` open to every
// origin, any website a browser visited could have driven this portfolio.
//
// Scoped to /api deliberately. Applied app-wide it also gated the static
// bundle this server serves at its own origin, so opening the app on port 3001
// had its JS and CSS rejected with "Origin not allowed" and rendered nothing.
// CORS protects the API; static assets do not need it.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || `http://localhost:5173,http://localhost:${PORT}`
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use('/api', cors({
  origin(origin, callback) {
    // Same-origin requests (the production build served by this server) and
    // non-browser clients send no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  }
}));
app.use(express.json({ limit: '100kb' }));

// Liveness probe - must stay unauthenticated and cheap.
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() });
});

// Exchange the app password for a session token. Unauthenticated by
// definition, and rate limited inside the handler.
app.post('/api/auth/login', loginHandler);

// Everything else under /api requires a valid session token.
app.use('/api', requireAuth);

// =====================
// REQUEST VALIDATION
// =====================

/**
 * Ticker symbols reach upstream URLs and Firestore document ids, so they are
 * checked rather than trusted. Returns an error string, or null when valid.
 */
function validateSymbol(symbol) {
  if (typeof symbol !== 'string' || !symbol.trim()) {
    return 'A ticker symbol is required';
  }
  if (!/^[A-Za-z.-]{1,10}$/.test(symbol.trim())) {
    return 'Invalid ticker symbol';
  }
  return null;
}

/**
 * Share counts arrive as JSON and used to be trusted blindly: a non-numeric
 * value produced NaN, and every `NaN <= 0` / `cash < NaN` comparison is false,
 * which walked straight past the insufficient-funds check.
 * Returns a positive integer, or null when invalid.
 */
function parseShareCount(value) {
  const shares = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(shares) || shares <= 0) return null;
  return shares;
}

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
    const { symbol, takeProfit: requestedTakeProfit, stopLoss: requestedStopLoss } = req.body;

    const symbolError = validateSymbol(req.body.symbol);
    if (symbolError) return res.status(400).json({ success: false, error: symbolError });

    const shares = parseShareCount(req.body.shares);
    if (shares === null) {
      return res.status(400).json({
        success: false,
        error: 'Share count must be a positive whole number'
      });
    }

    // Fetch a live price at execution time. getQuote() is cache-backed and its
    // TTL is long while the market is closed, so it must not price a trade.
    const quote = await getFreshQuote(symbol.toUpperCase());
    if (!quote || !quote.price) {
      return res.status(400).json({
        success: false,
        error: 'Unable to fetch current price. Market may be closed.'
      });
    }

    const price = quote.price;
    const { total, commission, totalCost, commissionPerShare } = calculateBuy({ price, shares });

    // Check if user has enough cash (including commission)
    const portfolio = await getPortfolio();
    if (portfolio.cash < totalCost) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. Required: $${totalCost.toFixed(2)} (incl. $${commission.toFixed(2)} fee), Available: $${portfolio.cash.toFixed(2)}`
      });
    }

    // Targets normally come from the ATR-based battle plan; this is the fallback.
    const takeProfit = requestedTakeProfit || price * (1 + FALLBACK_TAKE_PROFIT_PCT);
    const stopLoss = requestedStopLoss || price * (1 - FALLBACK_STOP_LOSS_PCT);

    // Update cash (deduct trade amount + commission)
    const newCashBalance = await adjustCash(-totalCost);

    // Track commission
    await addCommission(commission);

    // Update holdings (calculate new average cost if adding to position)
    const existingHolding = await getHolding(symbol.toUpperCase());
    let newShares, newAvgCost, newAvgCommissionPerShare;

    if (existingHolding) {
      const existingValue = existingHolding.shares * existingHolding.avg_cost;
      const newValue = shares * price;
      newShares = existingHolding.shares + shares;
      newAvgCost = (existingValue + newValue) / newShares;

      const existingCommission = buyCommissionPerShareFor(existingHolding) * existingHolding.shares;
      newAvgCommissionPerShare = (existingCommission + commission) / newShares;
    } else {
      newShares = shares;
      newAvgCost = price;
      newAvgCommissionPerShare = commissionPerShare;
    }

    // Store holding with TP/SL for automatic monitoring
    await upsertHolding(symbol.toUpperCase(), newShares, newAvgCost, takeProfit, stopLoss, newAvgCommissionPerShare);

    // Stamp the trade with the recommendation that was on screen. Read from
    // the log rather than trusting the client, so the link can't be forged or
    // forgotten - this is what makes hit-rate measurable later.
    let recommendation = null;
    try {
      recommendation = await getLatestRecommendation(symbol);
    } catch (e) {
      console.error('Could not attach recommendation to trade:', e.message);
    }

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
      stop_loss: stopLoss,
      recommendationId: recommendation?.id ?? null,
      verdictAtEntry: recommendation?.verdict ?? null,
      confidenceAtEntry: recommendation?.confidence ?? null,
      confidenceScoreAtEntry: recommendation?.confidenceScore ?? null
    };
    await addTrade(trade);

    res.json({
      success: true,
      data: {
        trade,
        message: `Bought ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)} (Fee: $${commission.toFixed(2)})`,
        newCashBalance,
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
    const { symbol } = req.body;

    const symbolError = validateSymbol(req.body.symbol);
    if (symbolError) return res.status(400).json({ success: false, error: symbolError });

    const shares = parseShareCount(req.body.shares);
    if (shares === null) {
      return res.status(400).json({
        success: false,
        error: 'Share count must be a positive whole number'
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

    // Fetch a live price at execution time - never price a trade off the cache.
    const quote = await getFreshQuote(symbol.toUpperCase());
    if (!quote || !quote.price) {
      return res.status(400).json({
        success: false,
        error: 'Unable to fetch current price. Market may be closed.'
      });
    }

    const price = quote.price;
    const outcome = calculateSell({
      price,
      shares,
      avgCost: holding.avg_cost,
      buyCommissionPerShare: buyCommissionPerShareFor(holding)
    });

    // Update cash (add net proceeds)
    const newCashBalance = await adjustCash(outcome.netProceeds);

    // Track commission and tax
    await addCommission(outcome.commission);
    if (outcome.taxAmount > 0) {
      await addTax(outcome.taxAmount);
    }
    await addRealizedPL(outcome.grossPL);

    // Update holdings
    const newShares = holding.shares - shares;
    await upsertHolding(
      symbol.toUpperCase(),
      newShares,
      holding.avg_cost,
      null,
      null,
      buyCommissionPerShareFor(holding)
    );

    // Record trade with all fee details
    const trade = buildSellTrade({
      id: uuidv4(),
      symbol,
      shares,
      price,
      outcome,
      exitType: 'MANUAL'
    });
    await addTrade(trade);

    res.json({
      success: true,
      data: {
        trade,
        message: `Sold ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)}`,
        newCashBalance,
        grossPL: outcome.grossPL,
        commission: outcome.commission,
        taxAmount: outcome.taxAmount,
        netRealizedPL: outcome.netRealizedPL,
        realizedPLPercent: outcome.realizedPLPercent
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

// =====================
// RECOMMENDATION PERFORMANCE
// =====================

// Does the scanner actually work? Hit rate and expectancy of past calls.
app.get('/api/recommendations/stats', async (req, res) => {
  try {
    const stats = await getPerformanceStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Could not compute recommendation stats' });
  }
});

// Score any recommendations that are now old enough to judge.
app.post('/api/recommendations/evaluate', async (req, res) => {
  try {
    const result = await evaluateOutcomes(getDailyBars);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Evaluate error:', error);
    res.status(500).json({ success: false, error: 'Could not evaluate recommendations' });
  }
});

// Unknown API routes must 404 as JSON. The SPA catch-all below used to answer
// them with index.html and HTTP 200, so the client tried to parse HTML as JSON.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `No such endpoint: ${req.method} ${req.originalUrl}` });
});

// Serve React app for any non-API routes (must be after all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Last-resort error handler. Internal messages stay in the log, not in the
// response body.
app.use((err, req, res, _next) => {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return;
  const status = err?.message === 'Origin not allowed' ? 403 : 500;
  res.status(status).json({
    success: false,
    error: status === 403 ? 'Origin not allowed' : 'Internal server error'
  });
});

// =====================
// START SERVER
// =====================

const server = app.listen(PORT, () => {
  console.log(`🚀 Trading Server running on http://localhost:${PORT}`);
  console.log(`📈 Market Scanner API: http://localhost:${PORT}/api/market/scan`);
  console.log(`💼 Portfolio API: http://localhost:${PORT}/api/portfolio`);
  console.log(`🔔 Alerts API: http://localhost:${PORT}/api/alerts`);
  console.log(`🌐 Static files served from: ${clientBuildPath}`);

  // Start the price monitoring service for auto TP/SL execution
  startPriceMonitor();

  // Score matured recommendations periodically, so the hit-rate stats stay
  // current without anyone having to ask for them.
  const runEvaluation = () => {
    evaluateOutcomes(getDailyBars).catch(e => console.error('Outcome evaluation failed:', e.message));
  };
  runEvaluation();
  evaluationInterval = setInterval(runEvaluation, 6 * 60 * 60 * 1000);
});

let evaluationInterval = null;

// Shut down cleanly so a redeploy can't kill the process mid-trade-write.
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received - shutting down`);
  stopPriceMonitor();
  if (evaluationInterval) clearInterval(evaluationInterval);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(0), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
