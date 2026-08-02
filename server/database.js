import { db } from './firestore.js';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Collection references
const portfolioRef = db.collection('portfolio').doc('main');
const holdingsRef = db.collection('holdings');
const tradesRef = db.collection('trades');
const watchlistRef = db.collection('watchlist').doc('symbols');
const alertsRef = db.collection('alerts');

// Default portfolio data (used for initialization/reset)
const defaultPortfolio = {
  cash: 100000,
  totalCommissionsPaid: 0,
  totalTaxesPaid: 0,
  totalRealizedPL: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// ---- Portfolio Functions ----

export async function getPortfolio() {
  const doc = await portfolioRef.get();
  if (!doc.exists) {
    await portfolioRef.set(defaultPortfolio);
    return { ...defaultPortfolio };
  }
  return doc.data();
}

export async function updateCash(newCash) {
  await portfolioRef.update({
    cash: newCash,
    updatedAt: new Date().toISOString()
  });
  return getPortfolio();
}

/**
 * Apply a relative change to cash atomically.
 *
 * Prefer this over updateCash() for every trade. Read-then-write loses updates
 * when a manual trade and an automatic TP/SL exit land at the same moment.
 */
export async function adjustCash(delta) {
  await portfolioRef.update({
    cash: FieldValue.increment(delta),
    updatedAt: new Date().toISOString()
  });
  const portfolio = await getPortfolio();
  return portfolio.cash;
}

export async function addCommission(amount) {
  await portfolioRef.update({
    totalCommissionsPaid: FieldValue.increment(amount),
    updatedAt: new Date().toISOString()
  });
  const portfolio = await getPortfolio();
  return portfolio.totalCommissionsPaid;
}

export async function addTax(amount) {
  await portfolioRef.update({
    totalTaxesPaid: FieldValue.increment(amount),
    updatedAt: new Date().toISOString()
  });
  const portfolio = await getPortfolio();
  return portfolio.totalTaxesPaid;
}

export async function addRealizedPL(amount) {
  await portfolioRef.update({
    totalRealizedPL: FieldValue.increment(amount),
    updatedAt: new Date().toISOString()
  });
  const portfolio = await getPortfolio();
  return portfolio.totalRealizedPL;
}

export async function getFeesSummary() {
  const portfolio = await getPortfolio();
  return {
    totalCommissionsPaid: portfolio.totalCommissionsPaid || 0,
    totalTaxesPaid: portfolio.totalTaxesPaid || 0,
    totalRealizedPL: portfolio.totalRealizedPL || 0,
    totalCosts: (portfolio.totalCommissionsPaid || 0) + (portfolio.totalTaxesPaid || 0)
  };
}

// ---- Holdings Functions ----

export async function getHoldings() {
  const snapshot = await holdingsRef.orderBy('symbol').get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getHolding(symbol) {
  const doc = await holdingsRef.doc(symbol.toUpperCase()).get();
  return doc.exists ? doc.data() : undefined;
}

export async function upsertHolding(symbol, shares, avgCost, takeProfit = null, stopLoss = null, avgCommissionPerShare = null) {
  const upperSymbol = symbol.toUpperCase();
  const docRef = holdingsRef.doc(upperSymbol);

  if (shares <= 0) {
    await docRef.delete();
    return null;
  }

  const existing = await docRef.get();
  if (existing.exists) {
    const updateData = {
      shares,
      avg_cost: avgCost,
      updatedAt: new Date().toISOString()
    };
    if (takeProfit !== null) updateData.take_profit = takeProfit;
    if (stopLoss !== null) updateData.stop_loss = stopLoss;
    // Buy-side commission per share, needed to compute the taxable gain on exit.
    if (avgCommissionPerShare !== null) updateData.avg_commission_per_share = avgCommissionPerShare;
    await docRef.update(updateData);
  } else {
    await docRef.set({
      id: uuidv4(),
      symbol: upperSymbol,
      shares,
      avg_cost: avgCost,
      avg_commission_per_share: avgCommissionPerShare ?? 0,
      take_profit: takeProfit,
      stop_loss: stopLoss,
      // The stop the position opened with. Defines 1R for the exit manager -
      // once stop_loss starts trailing it can no longer measure the original
      // risk.
      initial_stop: stopLoss,
      // High-water mark the trailing stop anchors to.
      highest_close: avgCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return getHolding(upperSymbol);
}

/**
 * Patch specific fields on an open holding.
 *
 * Used by the exit manager to move a stop up or record a new high-water mark,
 * without going through upsertHolding and having to restate shares and cost.
 */
export async function updateHoldingFields(symbol, fields) {
  const docRef = holdingsRef.doc(symbol.toUpperCase());
  const existing = await docRef.get();
  if (!existing.exists) return null;
  await docRef.update({ ...fields, updatedAt: new Date().toISOString() });
  return getHolding(symbol);
}

export async function deleteHolding(symbol) {
  await holdingsRef.doc(symbol.toUpperCase()).delete();
}

// ---- Trade History Functions ----

export async function getTrades(limit = 100) {
  const snapshot = await tradesRef
    .orderBy('executed_at', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => doc.data());
}

export async function addTrade(trade) {
  const tradeData = {
    ...trade,
    executed_at: new Date().toISOString()
  };
  await tradesRef.add(tradeData);
  return trade;
}

// ---- Watchlist Functions ----

export async function getWatchlist() {
  const doc = await watchlistRef.get();
  if (!doc.exists) {
    return [];
  }
  return (doc.data().symbols || []).sort();
}

export async function addToWatchlist(symbol) {
  const upperSymbol = symbol.toUpperCase();
  await watchlistRef.set(
    { symbols: FieldValue.arrayUnion(upperSymbol) },
    { merge: true }
  );
  return true;
}

export async function removeFromWatchlist(symbol) {
  const doc = await watchlistRef.get();
  if (!doc.exists) return;
  await watchlistRef.update({
    symbols: FieldValue.arrayRemove(symbol.toUpperCase())
  });
}

// ---- Alert Functions ----

export async function getAlerts(includeRead = false, limit = 200) {
  // Order in Firestore, filter in memory.
  //
  // `where('read','==',false).orderBy('created_at')` needs a composite index
  // that has never existed in this project, so the unread-alerts query - which
  // the UI polls every 30 seconds - failed with FAILED_PRECONDITION every time.
  // Alert volume is small, so filtering here costs nothing and removes the
  // dependency on an index that isn't in the repo.
  const snapshot = await alertsRef.orderBy('created_at', 'desc').limit(limit).get();
  const alerts = snapshot.docs.map(doc => doc.data());
  return includeRead ? alerts : alerts.filter(a => !a.read);
}

export async function addAlert(alert) {
  const newAlert = {
    id: Date.now(),
    ...alert,
    read: false,
    created_at: new Date().toISOString()
  };
  await alertsRef.add(newAlert);
  return newAlert;
}

export async function markAlertRead(alertId) {
  const snapshot = await alertsRef.where('id', '==', alertId).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  await doc.ref.update({ read: true });
  return { ...doc.data(), read: true };
}

/**
 * Firestore rejects a batch of more than 500 writes, so every bulk operation
 * commits in chunks. These used to build one unbounded batch, which meant a
 * portfolio reset would simply throw once the account had 500 trades.
 */
const BATCH_LIMIT = 450;

async function commitInChunks(docs, apply) {
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + BATCH_LIMIT)) apply(batch, doc);
    await batch.commit();
  }
}

export async function markAllAlertsRead() {
  const snapshot = await alertsRef.where('read', '==', false).get();
  if (snapshot.empty) return;
  await commitInChunks(snapshot.docs, (batch, doc) => batch.update(doc.ref, { read: true }));
}

export async function clearAlerts() {
  const snapshot = await alertsRef.get();
  if (snapshot.empty) return;
  await commitInChunks(snapshot.docs, (batch, doc) => batch.delete(doc.ref));
}

// ---- Reset ----

export async function resetPortfolio() {
  const newPortfolio = {
    cash: 100000,
    totalCommissionsPaid: 0,
    totalTaxesPaid: 0,
    totalRealizedPL: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await portfolioRef.set(newPortfolio);

  // Holdings, trades and alerts are wiped. The watchlist is kept, and so is
  // the `recommendations` log - that measures the scanner, not the account,
  // and discarding it would restart the 10-trading-day evaluation clock.
  const [holdingsSnap, tradesSnap, alertsSnap] = await Promise.all([
    holdingsRef.get(),
    tradesRef.get(),
    alertsRef.get()
  ]);

  const deleted = {
    holdings: holdingsSnap.size,
    trades: tradesSnap.size,
    alerts: alertsSnap.size
  };

  for (const snap of [holdingsSnap, tradesSnap, alertsSnap]) {
    if (!snap.empty) {
      await commitInChunks(snap.docs, (batch, doc) => batch.delete(doc.ref));
    }
  }

  return { ...newPortfolio, deleted };
}
