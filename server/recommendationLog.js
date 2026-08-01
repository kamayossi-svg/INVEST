/**
 * Append-only log of what the scanner recommended, and what happened next.
 *
 * Until now verdicts were computed, displayed and thrown away: the scan cache
 * was a single document overwritten on every scan, and nothing connected "the
 * app said BUY_NOW" to "the trade worked". That made the ~40 tuning constants
 * in the scoring engine unfalsifiable - there was no way to tell whether any of
 * them helped.
 *
 * One document per symbol per trading day. Re-scanning the same day updates the
 * live snapshot but never creates a duplicate, so the log stays one row per
 * decision rather than one row per refresh.
 */
import { db } from './firestore.js';

const recommendationsRef = db.collection('recommendations');

/** Verdicts worth recording. WATCH/AVOID would be mostly noise. */
const TRACKED_VERDICTS = ['BUY_NOW', 'WAIT_FOR_DIP'];

/** Trading days to wait before an outcome is scored. */
export const EVALUATION_HORIZON_DAYS = 10;

/** Firestore rejects a batch over 500 writes. */
const BATCH_LIMIT = 450;

function tradingDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function docIdFor(symbol, dayKey) {
  return `${symbol.toUpperCase()}_${dayKey}`;
}

/**
 * Record the actionable recommendations from a scan.
 */
export async function logRecommendations(results) {
  const dayKey = tradingDayKey();
  const tracked = results.filter(r =>
    r?.battlePlan && TRACKED_VERDICTS.includes(r.battlePlan.verdict) && r.hasRealData && !r.isStaleData
  );

  if (tracked.length === 0) return 0;

  let written = 0;
  for (let i = 0; i < tracked.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const r of tracked.slice(i, i + BATCH_LIMIT)) {
      const bp = r.battlePlan;
      batch.set(recommendationsRef.doc(docIdFor(r.symbol, dayKey)), {
        symbol: r.symbol.toUpperCase(),
        tradingDay: dayKey,
        recordedAt: new Date().toISOString(),

        verdict: bp.verdict,
        confidence: bp.confidence,
        confidenceScore: bp.confidenceScore,
        rawConfidenceScore: bp.rawConfidenceScore ?? bp.confidenceScore,

        price: r.price,
        entryLow: bp.entryZone?.low ?? null,
        entryHigh: bp.entryZone?.high ?? null,
        takeProfit: bp.profitTarget?.price ?? null,
        stopLoss: bp.stopLoss?.price ?? null,

        // Context to slice performance by later.
        sector: r.sector || null,
        rsi: r.rsi ?? null,
        volumeRatio: r.volumeRatio ?? null,
        sma20: r.sma20 ?? null,
        sma50: r.sma50 ?? null,
        filterResults: bp.filterResults || null,
        volatilityLevel: bp.safetyData?.volatilityLevel ?? null,
        earningsRisk: r.earningsData?.earningsRisk ?? null,
        analystConsensus: r.analystData?.consensus ?? null,

        // Filled in later by evaluateOutcomes()
        outcome: null
      }, { merge: true });
      written++;
    }
    await batch.commit();
  }

  console.log(`📓 Logged ${written} recommendation(s) for ${dayKey}`);
  return written;
}

/**
 * Most recent recommendation for a symbol, used to stamp a buy with the
 * verdict that was on screen when the user acted.
 */
export async function getLatestRecommendation(symbol, lookbackDays = 7) {
  // Walks back day by day using the deterministic document id instead of
  // querying. A `where(symbol) + orderBy(tradingDay)` query needs a composite
  // index that isn't in the repo, and would fail closed in production - the
  // trade would still succeed but silently lose its recommendation link.
  const upper = symbol.toUpperCase();
  const day = new Date();

  for (let i = 0; i <= lookbackDays; i++) {
    const key = tradingDayKey(day);
    const doc = await recommendationsRef.doc(docIdFor(upper, key)).get();
    if (doc.exists) return { id: doc.id, ...doc.data() };
    day.setDate(day.getDate() - 1);
  }
  return null;
}

/**
 * Score recommendations that are old enough to judge.
 *
 * For each one: did price reach the take-profit before the stop-loss, and what
 * was the forward return? Also records MAE/MFE - the worst and best excursion
 * along the way - which is the only way to tell whether the ATR-based stops are
 * too tight.
 *
 * @param {(symbol: string) => Promise<object|null>} loadDailyBars
 */
export async function evaluateOutcomes(loadDailyBars, limit = 100) {
  const snapshot = await recommendationsRef
    .where('outcome', '==', null)
    .limit(limit)
    .get();

  if (snapshot.empty) return { evaluated: 0, skipped: 0 };

  let evaluated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const rec = doc.data();
    try {
      const bars = await loadDailyBars(rec.symbol);
      if (!bars?.dates?.length) { skipped++; continue; }

      // Bars strictly after the recommendation's trading day.
      const forward = [];
      for (let i = 0; i < bars.dates.length; i++) {
        const day = tradingDayKey(new Date(bars.dates[i]));
        if (day > rec.tradingDay) {
          forward.push({ high: bars.highs[i], low: bars.lows[i], close: bars.closes[i] });
        }
      }

      if (forward.length < EVALUATION_HORIZON_DAYS) { skipped++; continue; }

      const window = forward.slice(0, EVALUATION_HORIZON_DAYS);
      const entry = rec.price;

      let hit = 'neither';
      for (const bar of window) {
        // Stop first: the conservative assumption when a single daily bar
        // spans both levels.
        if (rec.stopLoss && bar.low <= rec.stopLoss) { hit = 'stop'; break; }
        if (rec.takeProfit && bar.high >= rec.takeProfit) { hit = 'target'; break; }
      }

      const maxHigh = Math.max(...window.map(b => b.high));
      const minLow = Math.min(...window.map(b => b.low));
      const finalClose = window[window.length - 1].close;
      const riskPerShare = rec.stopLoss ? entry - rec.stopLoss : null;

      await doc.ref.update({
        outcome: {
          evaluatedAt: new Date().toISOString(),
          horizonDays: EVALUATION_HORIZON_DAYS,
          hit,
          forwardReturnPct: parseFloat((((finalClose - entry) / entry) * 100).toFixed(2)),
          // Maximum favourable / adverse excursion
          mfePct: parseFloat((((maxHigh - entry) / entry) * 100).toFixed(2)),
          maePct: parseFloat((((minLow - entry) / entry) * 100).toFixed(2)),
          // Result in units of the risk taken - the metric that makes trades
          // with different stop distances comparable.
          rMultiple: riskPerShare > 0
            ? parseFloat(((finalClose - entry) / riskPerShare).toFixed(2))
            : null
        }
      });
      evaluated++;
    } catch (error) {
      console.error(`Failed to evaluate ${rec.symbol} ${rec.tradingDay}:`, error.message);
      skipped++;
    }
  }

  if (evaluated) console.log(`📊 Evaluated ${evaluated} recommendation outcome(s)`);
  return { evaluated, skipped };
}

/**
 * Hit rate and expectancy, sliced by verdict and by confidence band.
 */
export async function getPerformanceStats() {
  const snapshot = await recommendationsRef.where('outcome', '!=', null).get();

  const blank = () => ({ count: 0, targetHits: 0, stopHits: 0, neither: 0, sumReturn: 0, sumR: 0, rCount: 0 });
  const overall = blank();
  const byVerdict = {};
  const byConfidence = {};

  for (const doc of snapshot.docs) {
    const rec = doc.data();
    const o = rec.outcome;
    if (!o) continue;

    for (const bucket of [
      overall,
      (byVerdict[rec.verdict] ||= blank()),
      (byConfidence[rec.confidence] ||= blank())
    ]) {
      bucket.count++;
      if (o.hit === 'target') bucket.targetHits++;
      else if (o.hit === 'stop') bucket.stopHits++;
      else bucket.neither++;
      bucket.sumReturn += o.forwardReturnPct || 0;
      if (typeof o.rMultiple === 'number') {
        bucket.sumR += o.rMultiple;
        bucket.rCount++;
      }
    }
  }

  const summarise = (b) => ({
    count: b.count,
    targetHitRate: b.count ? parseFloat(((b.targetHits / b.count) * 100).toFixed(1)) : null,
    stopHitRate: b.count ? parseFloat(((b.stopHits / b.count) * 100).toFixed(1)) : null,
    unresolvedRate: b.count ? parseFloat(((b.neither / b.count) * 100).toFixed(1)) : null,
    avgForwardReturnPct: b.count ? parseFloat((b.sumReturn / b.count).toFixed(2)) : null,
    // Average R is the number that actually says whether the edge is real:
    // above 0 means the recommendations made money per unit of risk taken.
    avgRMultiple: b.rCount ? parseFloat((b.sumR / b.rCount).toFixed(2)) : null
  });

  const pendingSnapshot = await recommendationsRef.where('outcome', '==', null).count().get();

  return {
    horizonDays: EVALUATION_HORIZON_DAYS,
    evaluated: overall.count,
    pending: pendingSnapshot.data().count,
    overall: summarise(overall),
    byVerdict: Object.fromEntries(Object.entries(byVerdict).map(([k, v]) => [k, summarise(v)])),
    byConfidence: Object.fromEntries(Object.entries(byConfidence).map(([k, v]) => [k, summarise(v)]))
  };
}
