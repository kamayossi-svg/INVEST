/**
 * Single source of truth for money math: broker commission, Israeli capital
 * gains tax, and the resulting cash movements.
 *
 * Both the manual sell route (index.js) and the automatic TP/SL exit
 * (priceMonitor.js) MUST go through here. They used to compute this
 * separately, and the automatic path skipped commission and tax entirely.
 */

// Broker & tax constants (IBI Israel)
export const MIN_COMMISSION = 7.5;     // $7.50 minimum per trade
export const COMMISSION_RATE = 0.001;  // 0.1% of notional
export const TAX_RATE = 0.25;          // 25% Israeli capital gains tax

// Fallback bracket used only when the caller supplies no explicit TP/SL.
// The real targets come from the ATR-based battle plan (marketService.js).
export const FALLBACK_TAKE_PROFIT_PCT = 0.08;
export const FALLBACK_STOP_LOSS_PCT = 0.04;

/**
 * Commission for a single order.
 */
export function calculateCommission(total) {
  return Math.max(MIN_COMMISSION, Math.abs(total) * COMMISSION_RATE);
}

/**
 * Cost side of a BUY.
 */
export function calculateBuy({ price, shares }) {
  const total = price * shares;
  const commission = calculateCommission(total);
  return {
    total,
    commission,
    totalCost: total + commission,
    commissionPerShare: shares > 0 ? commission / shares : 0
  };
}

/**
 * The buy-side commission attributable to one share of a holding.
 *
 * Holdings created before commissions were tracked have no stored value. Those
 * positions were opened with a single order, so the minimum commission spread
 * across the position is the closest estimate available.
 */
export function buyCommissionPerShareFor(holding) {
  if (typeof holding?.avg_commission_per_share === 'number') {
    return holding.avg_commission_per_share;
  }
  return holding?.shares > 0 ? MIN_COMMISSION / holding.shares : 0;
}

/**
 * Full outcome of a SELL.
 *
 * Israeli capital gains tax is charged on the gain net of acquisition AND
 * disposal costs, so the buy commission belongs in the taxable base. Cash,
 * however, only moves by the sell commission — the buy commission left the
 * account back when the position was opened.
 */
export function calculateSell({ price, shares, avgCost, buyCommissionPerShare = 0 }) {
  const total = price * shares;
  const sellCommission = calculateCommission(total);
  const costBasis = shares * avgCost;
  const grossPL = total - costBasis;

  const buyCommission = buyCommissionPerShare * shares;
  const totalCommission = sellCommission + buyCommission;

  const taxableProfit = grossPL - totalCommission;
  const taxAmount = taxableProfit > 0 ? taxableProfit * TAX_RATE : 0;

  // Cash credited to the account on settlement.
  const netProceeds = total - sellCommission - taxAmount;

  // True economic result of the round trip.
  const netRealizedPL = grossPL - totalCommission - taxAmount;

  return {
    total,
    costBasis,
    grossPL,
    commission: sellCommission,
    buyCommission,
    totalCommission,
    taxableProfit,
    taxAmount,
    netProceeds,
    netRealizedPL,
    realizedPLPercent: costBasis > 0 ? (grossPL / costBasis) * 100 : 0
  };
}

/**
 * Uniform SELL trade record.
 *
 * Manual sells and automatic exits previously wrote two different shapes
 * (`netRealizedPL` vs `realized_pl`), which made every automatic exit render
 * as a $0.00 trade in the UI. One shape, both paths.
 */
export function buildSellTrade({ id, symbol, shares, price, outcome, exitType = 'MANUAL' }) {
  return {
    id,
    symbol: symbol.toUpperCase(),
    action: 'SELL',
    shares,
    price,
    total: outcome.total,
    commission: outcome.commission,
    buyCommission: outcome.buyCommission,
    taxAmount: outcome.taxAmount,
    grossPL: outcome.grossPL,
    netRealizedPL: outcome.netRealizedPL,
    realizedPLPercent: outcome.realizedPLPercent,
    exit_type: exitType
  };
}
