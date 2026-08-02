/**
 * Market regime: is the broad market a tailwind or a headwind right now?
 *
 * Every stock used to be scored in complete isolation. In a market-wide
 * drawdown the scanner happily kept issuing BUY_NOW for anything still above
 * its own SMA50 - but in a drawdown, index beta swamps single-name selection,
 * and "above SMA50 with RSI 55" fires constantly on names about to roll over.
 *
 * Uses SPY as the market proxy. Deliberately simple: two moving averages and a
 * drawdown check, all computed from closed daily bars.
 */

const REGIME_CACHE_TTL = 15 * 60 * 1000;
let cache = null;

export const REGIME_PROXY = 'SPY';

/** Drawdown from the recent high that flips a healthy tape to cautious. */
const CORRECTION_DRAWDOWN_PCT = 5;
const BEAR_DRAWDOWN_PCT = 10;

function sma(values, period) {
  if (!values || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * @param {(symbol: string) => Promise<object|null>} loadDailyBars
 *   Injected rather than imported, to avoid a cycle with marketService.
 */
export async function getMarketRegime(loadDailyBars, force = false) {
  if (!force && cache && Date.now() - cache.at < REGIME_CACHE_TTL) {
    return cache.value;
  }

  try {
    const bars = await loadDailyBars(REGIME_PROXY);
    if (!bars?.closes?.length) throw new Error('no SPY bars');

    const closes = bars.closes;
    const price = closes[closes.length - 1];
    const sma50 = sma(closes, 50);
    // Only ~125 bars are fetched (6 months), so a true 200-day average is not
    // available; 100 is the longest honest slow average here.
    const smaSlow = sma(closes, 100);

    const recentHigh = Math.max(...closes.slice(-60));
    const drawdownPct = ((recentHigh - price) / recentHigh) * 100;

    const aboveFast = sma50 !== null && price > sma50;
    const aboveSlow = smaSlow !== null && price > smaSlow;

    let regime, reason;
    if (drawdownPct >= BEAR_DRAWDOWN_PCT || !aboveSlow) {
      regime = 'risk_off';
      reason = !aboveSlow
        ? `${REGIME_PROXY} below its 100-day average`
        : `${REGIME_PROXY} ${drawdownPct.toFixed(1)}% off its 3-month high`;
    } else if (!aboveFast || drawdownPct >= CORRECTION_DRAWDOWN_PCT) {
      regime = 'neutral';
      reason = !aboveFast
        ? `${REGIME_PROXY} below its 50-day average but above the 100-day`
        : `${REGIME_PROXY} ${drawdownPct.toFixed(1)}% off its 3-month high`;
    } else {
      regime = 'risk_on';
      reason = `${REGIME_PROXY} above both moving averages, ${drawdownPct.toFixed(1)}% off its high`;
    }

    const value = {
      regime,
      reason,
      proxy: REGIME_PROXY,
      price: parseFloat(price.toFixed(2)),
      sma50: sma50 !== null ? parseFloat(sma50.toFixed(2)) : null,
      smaSlow: smaSlow !== null ? parseFloat(smaSlow.toFixed(2)) : null,
      drawdownPct: parseFloat(drawdownPct.toFixed(2)),
      isFallback: false
    };

    cache = { at: Date.now(), value };
    console.log(`🌐 Market regime: ${regime.toUpperCase()} - ${reason}`);
    return value;
  } catch (error) {
    console.error('Market regime unavailable:', error.message);
    // Fail to 'neutral', never to 'risk_on'. An unknown market is not a
    // reason to be more confident.
    return cache?.value
      ? { ...cache.value, isFallback: true }
      : {
          regime: 'neutral',
          reason: 'Market data unavailable - treating conditions as neutral',
          proxy: REGIME_PROXY,
          price: null, sma50: null, smaSlow: null, drawdownPct: null,
          isFallback: true
        };
  }
}

/**
 * Score penalty and verdict ceiling implied by the regime.
 *
 * risk_off does not merely subtract points - it caps the verdict, because no
 * amount of single-name strength makes a broad downtrend a good entry.
 */
export function regimeAdjustment(regime) {
  switch (regime) {
    case 'risk_off':
      return { penalty: 25, maxVerdict: 'WATCH', warning: 'MARKET DOWNTREND: broad market is in a drawdown' };
    case 'neutral':
      return { penalty: 10, maxVerdict: null, warning: 'MARKET MIXED: broad market is not confirming' };
    default:
      return { penalty: 0, maxVerdict: null, warning: null };
  }
}
