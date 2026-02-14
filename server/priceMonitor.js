import { getHoldings, getPortfolio, updateCash, upsertHolding, addTrade, addAlert } from './database.js';
import { getQuote, isMarketOpen } from './marketService.js';

// Check intervals in milliseconds
const MARKET_OPEN_INTERVAL = 30000;    // 30 seconds when market is open
const MARKET_CLOSED_INTERVAL = 300000; // 5 minutes when market is closed

let monitorInterval = null;
let currentInterval = MARKET_CLOSED_INTERVAL; // Start with closed interval

/**
 * Check all holdings against their take-profit and stop-loss levels
 */
export async function checkPriceTargets() {
  const marketStatus = isMarketOpen();
  const marketOpen = marketStatus.isOpen;

  // Adjust interval based on market status
  const targetInterval = marketOpen ? MARKET_OPEN_INTERVAL : MARKET_CLOSED_INTERVAL;
  if (targetInterval !== currentInterval && monitorInterval) {
    console.log(`📊 Market ${marketOpen ? 'opened' : 'closed'} - switching to ${targetInterval / 1000}s interval`);
    clearInterval(monitorInterval);
    currentInterval = targetInterval;
    monitorInterval = setInterval(checkPriceTargets, currentInterval);
  }

  // Skip price checks when market is closed
  if (!marketOpen) {
    console.log(`\n💤 Market closed (${marketStatus.reason}) - skipping price check`);
    return;
  }

  const holdings = getHoldings();

  if (holdings.length === 0) return;

  console.log(`\n🔍 Price Monitor: Checking ${holdings.length} positions...`);

  for (const holding of holdings) {
    // Skip if no TP/SL set
    if (!holding.take_profit && !holding.stop_loss) continue;

    try {
      const quote = await getQuote(holding.symbol);
      if (!quote || !quote.price) continue;

      const currentPrice = quote.price;

      // Check Take Profit
      if (holding.take_profit && currentPrice >= holding.take_profit) {
        console.log(`🎯 TAKE PROFIT triggered for ${holding.symbol}! Price: $${currentPrice} >= Target: $${holding.take_profit}`);
        await executeAutoExit(holding, currentPrice, 'TAKE_PROFIT');
        continue; // Position closed, move to next
      }

      // Check Stop Loss
      if (holding.stop_loss && currentPrice <= holding.stop_loss) {
        console.log(`🛑 STOP LOSS triggered for ${holding.symbol}! Price: $${currentPrice} <= Stop: $${holding.stop_loss}`);
        await executeAutoExit(holding, currentPrice, 'STOP_LOSS');
        continue; // Position closed, move to next
      }

    } catch (error) {
      console.error(`Error checking ${holding.symbol}:`, error.message);
    }
  }
}

/**
 * Retroactive check for missed TP/SL triggers using day's high/low
 * Called once on app startup when market is closed
 */
async function checkRetroactivePriceTargets() {
  const holdings = getHoldings();
  if (holdings.length === 0) return;

  console.log(`\n🔄 Retroactive Check: Reviewing ${holdings.length} positions for missed TP/SL...`);

  for (const holding of holdings) {
    // Skip if no TP/SL set
    if (!holding.take_profit && !holding.stop_loss) continue;

    try {
      const quote = await getQuote(holding.symbol);
      if (!quote || !quote.high || !quote.low) continue;

      const { high, low } = quote;

      // Check Stop Loss FIRST (conservative - SL takes priority)
      if (holding.stop_loss && low <= holding.stop_loss) {
        console.log(`🛑 RETROACTIVE STOP LOSS for ${holding.symbol}! Day low: $${low.toFixed(2)} <= Stop: $${holding.stop_loss.toFixed(2)}`);
        await executeAutoExit(holding, holding.stop_loss, 'STOP_LOSS');
        continue;
      }

      // Check Take Profit
      if (holding.take_profit && high >= holding.take_profit) {
        console.log(`🎯 RETROACTIVE TAKE PROFIT for ${holding.symbol}! Day high: $${high.toFixed(2)} >= Target: $${holding.take_profit.toFixed(2)}`);
        await executeAutoExit(holding, holding.take_profit, 'TAKE_PROFIT');
        continue;
      }

    } catch (error) {
      console.error(`Error checking ${holding.symbol}:`, error.message);
    }
  }
}

/**
 * Execute an automatic exit (sell all shares)
 */
async function executeAutoExit(holding, exitPrice, exitType) {
  const portfolio = getPortfolio();
  const shares = holding.shares;
  const totalProceeds = shares * exitPrice;
  const costBasis = shares * holding.avg_cost;
  const realizedPL = totalProceeds - costBasis;
  const realizedPLPercent = ((realizedPL / costBasis) * 100).toFixed(2);

  // Update cash
  const newCash = portfolio.cash + totalProceeds;
  updateCash(newCash);

  // Remove holding
  upsertHolding(holding.symbol, 0, 0);

  // Record the trade
  addTrade({
    id: Date.now(),
    symbol: holding.symbol,
    action: 'SELL',
    shares: shares,
    price: exitPrice,
    total: totalProceeds,
    exit_type: exitType, // 'TAKE_PROFIT' or 'STOP_LOSS'
    realized_pl: realizedPL,
    realized_pl_percent: parseFloat(realizedPLPercent)
  });

  // Create alert for user
  const isProfit = exitType === 'TAKE_PROFIT';
  addAlert({
    type: exitType,
    symbol: holding.symbol,
    shares: shares,
    exit_price: exitPrice,
    target_price: isProfit ? holding.take_profit : holding.stop_loss,
    realized_pl: realizedPL,
    realized_pl_percent: parseFloat(realizedPLPercent),
    message: isProfit
      ? `🎯 Take Profit executed for ${holding.symbol}! Sold ${shares} shares at $${exitPrice.toFixed(2)}. Profit: $${realizedPL.toFixed(2)} (+${realizedPLPercent}%)`
      : `🛑 Stop Loss executed for ${holding.symbol}! Sold ${shares} shares at $${exitPrice.toFixed(2)}. Loss: $${Math.abs(realizedPL).toFixed(2)} (${realizedPLPercent}%)`
  });

  console.log(`✅ Auto-exit complete: ${holding.symbol} - ${exitType} - P&L: $${realizedPL.toFixed(2)} (${realizedPLPercent}%)`);
}

/**
 * Start the price monitoring service
 */
export function startPriceMonitor() {
  if (monitorInterval) {
    console.log('Price monitor already running');
    return;
  }

  console.log('🚀 Starting Price Monitor Service...');

  // Determine initial interval based on market status
  const marketStatus = isMarketOpen();
  const marketOpen = marketStatus.isOpen;
  currentInterval = marketOpen ? MARKET_OPEN_INTERVAL : MARKET_CLOSED_INTERVAL;
  console.log(`   Market ${marketOpen ? 'open' : 'closed'} (${marketStatus.reason}) - checking every ${currentInterval / 1000} seconds`);

  // Run appropriate check immediately based on market status
  if (marketOpen) {
    checkPriceTargets();
  } else {
    // Check for missed TP/SL using day's high/low when market is closed
    checkRetroactivePriceTargets();
  }

  // Then run on interval
  monitorInterval = setInterval(checkPriceTargets, currentInterval);
}

/**
 * Stop the price monitoring service
 */
export function stopPriceMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('Price Monitor stopped');
  }
}

export default { startPriceMonitor, stopPriceMonitor, checkPriceTargets };
