/**
 * Portfolio risk rules.
 *
 * Position size used to be a literal: `const basePositionValue = 5000`. It was
 * unrelated to the account, so the plan recommended a $5,000 position whether
 * the account held $80,000 or $800 - and because the stop distance is ATR-driven
 * while the size was near-constant, the actual dollar risk per recommendation
 * varied by 5-10x across a single scan.
 *
 * Sizing now works the other way round: decide how much of the account may be
 * lost on one trade, then solve for the share count from the stop distance.
 */

/**
 * Fraction of equity risked if the stop is hit. THE dial to turn.
 *
 * 0.35%, not the classic 1%, because this account runs 11-12 concurrent
 * positions: 1% each would put 11-12% of equity at risk simultaneously. At
 * 0.35% total open risk stays near 4% and positions land around $10k on this
 * account - roughly ten fully-invested slots.
 *
 * This value and MAX_POSITION_PCT_OF_EQUITY interact: the cap binds whenever
 * the stop is tighter than RISK_PER_TRADE_PCT / MAX_POSITION_PCT_OF_EQUITY.
 * At 0.35% / 20% that is a 1.75% stop, so typical 3-6% ATR stops let the risk
 * rule decide - which is the point. Pairing 1% risk with a 10% cap produced
 * similar sizes but the cap bound every time, making size independent of stop
 * width again and defeating the whole mechanism.
 */
export const RISK_PER_TRADE_PCT = 0.0035;

/**
 * No single position may exceed this share of equity, however tight the stop.
 *
 * A backstop against an unusually tight stop justifying an enormous position -
 * not the everyday constraint. See RISK_PER_TRADE_PCT for how the two interact.
 */
export const MAX_POSITION_PCT_OF_EQUITY = 0.20;

/** Keep this fraction of equity in cash rather than deployable. */
export const CASH_RESERVE_PCT = 0.05;

/**
 * Maximum share of equity in any one sector.
 *
 * Sector was tracked on every quote and used purely for display, so nothing
 * stopped the top of a scan being five semiconductor names in a row. Ten
 * positions in one sector is one bet wearing a diversification costume.
 */
export const MAX_SECTOR_PCT_OF_EQUITY = 0.30;

/**
 * Below this notional the round-trip commission is a meaningful drag
 * ($15 on $1,500 is a 1% hurdle before the trade even starts).
 */
export const MIN_POSITION_VALUE = 1500;

/**
 * Maximum simultaneous open positions.
 *
 * Deliberately set above the position count in the account today (11) so this
 * rule doesn't retroactively block every new trade. Classic swing-trading
 * guidance is 5-8; lower it if you want the tool to enforce that.
 */
export const MAX_OPEN_POSITIONS = 12;

/**
 * Maximum total open risk across the portfolio ("heat"): the sum of what every
 * open position would lose if all of them hit their stops. With 1% risked per
 * trade this allows roughly 10 fully-risked positions at once.
 */
export const MAX_PORTFOLIO_HEAT_PCT = 0.10;

// =====================
// EXIT MANAGEMENT
// =====================
// The entry logic had eleven detectors; the exit was a fixed target and a fixed
// stop, with no trailing, no breakeven move and no time limit. In swing
// trading most of the edge lives in the exit.

/**
 * Once the trade is up this many multiples of the initial risk, move the stop
 * to the entry price. Turns a winner into a free trade.
 */
export const BREAKEVEN_TRIGGER_R = 1.0;

/**
 * Beyond this many R, trail the stop at TRAILING_STOP_ATR_MULTIPLE ATRs below
 * the highest close since entry.
 */
export const TRAILING_TRIGGER_R = 1.5;
export const TRAILING_STOP_ATR_MULTIPLE = 2.0;

/**
 * Close a position that has gone nowhere after this many trading days.
 *
 * A swing thesis is a 2-10 day idea. Past that the setup that justified the
 * entry has expired whether or not price hit a level, and the capital is
 * better used elsewhere.
 */
export const TIME_STOP_TRADING_DAYS = 15;

/** A time stop only fires if the trade is within this band of the entry. */
export const TIME_STOP_MAX_MOVE_PCT = 3;
