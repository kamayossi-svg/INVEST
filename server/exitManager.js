/**
 * Exit management for open positions.
 *
 * The scanner spent eleven detectors deciding when to get in, and then exited
 * on a fixed 2:1 target or a fixed stop - no trailing, no breakeven move, no
 * time limit. This module adds the three exit rules that do the most work in a
 * swing strategy, and it only ever moves a stop UP: a stop that can loosen is
 * not a stop.
 */
import {
  BREAKEVEN_TRIGGER_R,
  TRAILING_TRIGGER_R,
  TRAILING_STOP_ATR_MULTIPLE,
  TIME_STOP_TRADING_DAYS,
  TIME_STOP_MAX_MOVE_PCT
} from './riskConfig.js';

/** Trading days between two dates, approximated as calendar days x 5/7. */
export function tradingDaysSince(isoDate, now = new Date()) {
  if (!isoDate) return null;
  const days = (now.getTime() - new Date(isoDate).getTime()) / 86400000;
  return Math.max(0, Math.floor(days * 5 / 7));
}

/**
 * Decide what should happen to an open position right now.
 *
 * @param {object} holding   shares, avg_cost, stop_loss, take_profit, initial_stop, highest_close, createdAt
 * @param {number} price     current mark
 * @param {number|null} atr  current ATR, for the trailing distance
 * @returns {{action: 'hold'|'exit', exitReason?: string, newStop?: number, stopReason?: string}}
 */
export function evaluateExit(holding, price, atr) {
  const entry = holding.avg_cost;
  // The stop the position was opened with defines 1R. Once the stop starts
  // moving, the current stop can no longer be used to measure risk.
  const initialStop = holding.initial_stop ?? holding.stop_loss;
  const riskPerShare = initialStop ? entry - initialStop : null;

  if (!entry || !riskPerShare || riskPerShare <= 0) {
    return { action: 'hold' };
  }

  const rMultiple = (price - entry) / riskPerShare;

  // --- Time stop: the thesis has expired ---
  const daysHeld = tradingDaysSince(holding.createdAt);
  const movePct = ((price - entry) / entry) * 100;
  if (
    daysHeld !== null &&
    daysHeld >= TIME_STOP_TRADING_DAYS &&
    Math.abs(movePct) <= TIME_STOP_MAX_MOVE_PCT
  ) {
    return {
      action: 'exit',
      exitReason: 'TIME_STOP',
      message: `Flat after ${daysHeld} trading days (${movePct.toFixed(1)}%) - swing thesis expired`
    };
  }

  // --- Stop management: trailing beats breakeven beats the original stop ---
  let newStop = null;
  let stopReason = null;

  if (rMultiple >= TRAILING_TRIGGER_R && atr > 0) {
    // Trail from the best close seen, not from the current price, so a pullback
    // cannot loosen the stop.
    const anchor = Math.max(holding.highest_close ?? price, price);
    const trailed = anchor - atr * TRAILING_STOP_ATR_MULTIPLE;
    if (trailed > (holding.stop_loss ?? -Infinity)) {
      newStop = trailed;
      stopReason = 'TRAILING';
    }
  } else if (rMultiple >= BREAKEVEN_TRIGGER_R) {
    if (entry > (holding.stop_loss ?? -Infinity)) {
      newStop = entry;
      stopReason = 'BREAKEVEN';
    }
  }

  // Never below the current stop, and never above the current price - a stop
  // at or above the mark would fire instantly at an unrealistic fill.
  if (newStop !== null && newStop >= price) {
    newStop = null;
    stopReason = null;
  }

  return newStop !== null
    ? { action: 'hold', newStop: parseFloat(newStop.toFixed(2)), stopReason, rMultiple }
    : { action: 'hold', rMultiple };
}
