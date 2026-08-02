import { v4 as uuidv4 } from 'uuid';
import {
  getHoldings,
  adjustCash,
  upsertHolding,
  updateHoldingFields,
  addTrade,
  addAlert,
  addCommission,
  addTax,
  addRealizedPL
} from './database.js';
import { calculateSell, buildSellTrade, buyCommissionPerShareFor } from './tradeMath.js';
import { getQuote, isMarketOpen, getDailyBars, calculateATR } from './marketService.js';
import { evaluateExit } from './exitManager.js';

/** ATR for the trailing stop distance. Bars come from the shared cache. */
async function currentAtr(symbol) {
  try {
    const bars = await getDailyBars(symbol);
    const atr = calculateATR(bars?.highs, bars?.lows, bars?.closes, 14);
    return atr?.atr ?? null;
  } catch {
    return null;
  }
}

// Check intervals in milliseconds
const MARKET_OPEN_INTERVAL = 30000;    // 30 seconds when market is open
const MARKET_CLOSED_INTERVAL = 300000; // 5 minutes when market is closed

let monitorInterval = null;
let currentInterval = MARKET_CLOSED_INTERVAL; // Start with closed interval

// A pass that runs longer than the interval would otherwise overlap with the
// next one, and both could exit the same position - a double sell.
let checkInFlight = false;

/**
 * Check all holdings against their take-profit and stop-loss levels
 */
export async function checkPriceTargets() {
  if (checkInFlight) {
    console.log('⏭️  Previous price check still running - skipping this pass');
    return;
  }
  checkInFlight = true;
  try {
    await runPriceCheck();
  } finally {
    checkInFlight = false;
  }
}

async function runPriceCheck() {
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

  const holdings = await getHoldings();

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

      // Neither level was hit. Manage the position: trail the stop, move it to
      // breakeven, or close a trade whose thesis has expired.
      const atr = await currentAtr(holding.symbol);
      const decision = evaluateExit(holding, currentPrice, atr);

      if (decision.action === 'exit') {
        console.log(`⏱️  ${decision.exitReason} for ${holding.symbol}: ${decision.message}`);
        await executeAutoExit(holding, currentPrice, decision.exitReason);
        continue;
      }

      // Track the high-water mark the trailing stop anchors to.
      const highestClose = Math.max(holding.highest_close ?? 0, currentPrice);
      const updates = {};
      if (highestClose !== holding.highest_close) updates.highest_close = highestClose;
      if (decision.newStop) {
        console.log(`🔒 ${decision.stopReason} stop for ${holding.symbol}: $${holding.stop_loss?.toFixed(2)} -> $${decision.newStop.toFixed(2)} (${decision.rMultiple.toFixed(2)}R)`);
        updates.stop_loss = decision.newStop;
      }
      if (Object.keys(updates).length > 0) {
        await updateHoldingFields(holding.symbol, updates);
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
  const holdings = await getHoldings();
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
  const shares = holding.shares;

  // Same money math as a manual sell. This path used to credit the full
  // proceeds and charge neither commission nor tax, which inflated cash and
  // left realized P&L out of the portfolio totals entirely.
  const outcome = calculateSell({
    price: exitPrice,
    shares,
    avgCost: holding.avg_cost,
    buyCommissionPerShare: buyCommissionPerShareFor(holding)
  });

  // Update cash atomically - a manual trade may be landing at the same moment
  await adjustCash(outcome.netProceeds);

  // Track commission, tax and realized P&L
  await addCommission(outcome.commission);
  if (outcome.taxAmount > 0) {
    await addTax(outcome.taxAmount);
  }
  await addRealizedPL(outcome.grossPL);

  // Remove holding
  await upsertHolding(holding.symbol, 0, 0);

  // Record the trade in the same shape a manual sell produces
  await addTrade(buildSellTrade({
    id: uuidv4(),
    symbol: holding.symbol,
    shares,
    price: exitPrice,
    outcome,
    exitType
  }));

  // Create alert for user
  const isProfit = exitType === 'TAKE_PROFIT';
  const netPL = outcome.netRealizedPL;
  const plPercent = outcome.realizedPLPercent.toFixed(2);
  await addAlert({
    type: exitType,
    symbol: holding.symbol,
    shares: shares,
    exit_price: exitPrice,
    target_price: isProfit ? holding.take_profit : holding.stop_loss,
    realized_pl: netPL,
    realized_pl_percent: parseFloat(plPercent),
    message: isProfit
      ? `🎯 Take Profit executed for ${holding.symbol}! Sold ${shares} shares at $${exitPrice.toFixed(2)}. Net after fees & tax: $${netPL.toFixed(2)}`
      : `🛑 Stop Loss executed for ${holding.symbol}! Sold ${shares} shares at $${exitPrice.toFixed(2)}. Net after fees: $${netPL.toFixed(2)}`
  });

  console.log(`✅ Auto-exit complete: ${holding.symbol} - ${exitType} - gross P&L: $${outcome.grossPL.toFixed(2)}, fees: $${outcome.commission.toFixed(2)}, tax: $${outcome.taxAmount.toFixed(2)}, net: $${netPL.toFixed(2)}`);
}

/**
 * Start the price monitoring service
 */
export function startPriceMonitor() {
  if (monitorInterval) {
    console.log('Price monitor already running');
    return;
  }

  // Safety valve: the monitor writes to the live portfolio (auto-sells positions).
  // Set DISABLE_PRICE_MONITOR=1 when running a second instance (e.g. local dev
  // alongside the deployed server) so two monitors can't both exit the same position.
  if (process.env.DISABLE_PRICE_MONITOR === '1') {
    console.log('⏸️  Price Monitor DISABLED (DISABLE_PRICE_MONITOR=1) - no automatic TP/SL execution');
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
