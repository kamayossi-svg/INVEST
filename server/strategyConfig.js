/**
 * The strategy contract - what this scanner is actually looking for.
 *
 * This file exists because the scanner had drifted into being two strategies at
 * once. It is named a swing/dip sniper, ranks candidates by how close they are
 * to their SMA20, and its original Python version used an RSI band of 40-70
 * that deliberately included the pullback zone. But the Node filters demanded
 * RSI 48-72 AND price above SMA50 AND volume above 110% of average - which is a
 * momentum-breakout screen. It excluded RSI 40-48, exactly where dips live.
 *
 * Buying strength and buying weakness are both defensible. Doing both at once
 * is not: they want different entries, different targets and different holding
 * periods. So the choice is now explicit and lives in one place.
 */

export const STRATEGY_PROFILES = {
  /**
   * Buy a pullback inside an intact uptrend.
   *
   * The trend filter (price above SMA50) still applies - this is not
   * bottom-fishing. What changes is that a stock is wanted while it is pulling
   * back toward its SMA20, not while it is extending away from it.
   */
  dip_in_uptrend: {
    label: 'Dip in uptrend',
    description: 'Buy pullbacks toward the SMA20 while the SMA50 uptrend is intact',

    // Includes the 40-48 pullback zone the momentum band excluded.
    rsiMin: 40,
    rsiMax: 65,
    // Looser band for a symbol that already passed, to stop it flickering.
    rsiHysteresisMin: 38,
    rsiHysteresisMax: 68,

    // A pullback does not need heavy volume. Requiring 110% of average was a
    // breakout criterion; here it only needs to not be drying up entirely.
    minVolumeRatio: 0.80,

    // The entry must actually be a dip: too far above the SMA20 and the move
    // has already happened.
    maxPercentAboveSma20: 6,

    // Rank the shallowest entries first.
    rankByDipDepth: true
  },

  /**
   * Buy strength confirming itself on volume. The behaviour the filters
   * actually implemented before this file existed.
   */
  momentum_breakout: {
    label: 'Momentum breakout',
    description: 'Buy strength confirming on above-average volume',

    rsiMin: 48,
    rsiMax: 72,
    rsiHysteresisMin: 45,
    rsiHysteresisMax: 75,

    minVolumeRatio: 1.10,

    // Extension above the SMA20 is the point, not a disqualifier.
    maxPercentAboveSma20: null,

    rankByDipDepth: false
  }
};

/**
 * Active profile. Change this one line to switch strategies wholesale.
 *
 * Defaults to the dip profile because that is what the rest of the app already
 * claims to do - its name, its ranking and its educational copy all describe
 * buying pullbacks.
 */
export const ACTIVE_STRATEGY = process.env.STRATEGY_PROFILE || 'dip_in_uptrend';

export const strategy = STRATEGY_PROFILES[ACTIVE_STRATEGY] || STRATEGY_PROFILES.dip_in_uptrend;

/**
 * Bumped whenever the entry rules change, and stamped on every logged
 * recommendation. Without it, outcomes recorded under different rules would be
 * pooled into one meaningless hit rate.
 */
export const RULESET_VERSION = 2;

console.log(`📐 Strategy: ${strategy.label} (ruleset v${RULESET_VERSION})`);
