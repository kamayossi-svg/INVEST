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
