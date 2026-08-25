import { db } from './firestore.js';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function upsertHolding(symbol, shares, avgCost, takeProfit = null, stopLoss = null) {
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
    await docRef.update(updateData);
  } else {
    await docRef.set({
      id: Date.now(),
      symbol: upperSymbol,
      shares,
      avg_cost: avgCost,
      take_profit: takeProfit,
      stop_loss: stopLoss,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return getHolding(upperSymbol);
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

export async function getAlerts(includeRead = false) {
  let query;
  if (includeRead) {
    query = alertsRef.orderBy('created_at', 'desc');
  } else {
    query = alertsRef.where('read', '==', false).orderBy('created_at', 'desc');
  }
  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data());
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

export async function markAllAlertsRead() {
  const snapshot = await alertsRef.where('read', '==', false).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  await batch.commit();
}

export async function clearAlerts() {
  const snapshot = await alertsRef.get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
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

  // Delete all holdings
  const holdingsSnap = await holdingsRef.get();
  if (!holdingsSnap.empty) {
    const batch1 = db.batch();
    holdingsSnap.docs.forEach(doc => batch1.delete(doc.ref));
    await batch1.commit();
  }

  // Delete all trades
  const tradesSnap = await tradesRef.get();
  if (!tradesSnap.empty) {
    const batch2 = db.batch();
    tradesSnap.docs.forEach(doc => batch2.delete(doc.ref));
    await batch2.commit();
  }

  // Delete all alerts (keep watchlist as original code does)
  const alertsSnap = await alertsRef.get();
  if (!alertsSnap.empty) {
    const batch3 = db.batch();
    alertsSnap.docs.forEach(doc => batch3.delete(doc.ref));
    await batch3.commit();
  }

  return newPortfolio;
}
