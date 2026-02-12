import { getHoldings, getPortfolio, updateCash, upsertHolding, addTrade, addAlert } from './database.js';
import { getQuote } from './marketService.js';

// Check interval in milliseconds (30 seconds)
const CHECK_INTERVAL = 30000;

let monitorInterval = null;

/**
 * Check all holdings against their take-profit and stop-loss levels
 */
export async function checkPriceTargets() {
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
  console.log(`   Checking positions every ${CHECK_INTERVAL / 1000} seconds`);

  // Run immediately once
  checkPriceTargets();

  // Then run on interval
  monitorInterval = setInterval(checkPriceTargets, CHECK_INTERVAL);
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
