import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.json');

// Default database structure
const defaultData = {
  portfolio: {
    cash: 100000,
    totalCommissionsPaid: 0,  // Cumulative broker fees
    totalTaxesPaid: 0,        // Cumulative capital gains tax
    totalRealizedPL: 0,       // Cumulative realized P&L (before tax)
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  holdings: [],
  trades: [],
  watchlist: [],
  alerts: [] // For triggered auto-exits
};

// Load database from file
function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error.message);
  }
  return { ...defaultData };
}

// Save database to file
function saveDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving database:', error.message);
  }
}

// Initialize database
let db = loadDb();

// Portfolio functions
export function getPortfolio() {
  return db.portfolio;
}

export function updateCash(newCash) {
  db.portfolio.cash = newCash;
  db.portfolio.updatedAt = new Date().toISOString();
  saveDb(db);
  return db.portfolio;
}

// Update cumulative fees and taxes
export function addCommission(amount) {
  db.portfolio.totalCommissionsPaid = (db.portfolio.totalCommissionsPaid || 0) + amount;
  db.portfolio.updatedAt = new Date().toISOString();
  saveDb(db);
  return db.portfolio.totalCommissionsPaid;
}

export function addTax(amount) {
  db.portfolio.totalTaxesPaid = (db.portfolio.totalTaxesPaid || 0) + amount;
  db.portfolio.updatedAt = new Date().toISOString();
  saveDb(db);
  return db.portfolio.totalTaxesPaid;
}

export function addRealizedPL(amount) {
  db.portfolio.totalRealizedPL = (db.portfolio.totalRealizedPL || 0) + amount;
  db.portfolio.updatedAt = new Date().toISOString();
  saveDb(db);
  return db.portfolio.totalRealizedPL;
}

// Get cumulative fee/tax summary
export function getFeesSummary() {
  return {
    totalCommissionsPaid: db.portfolio.totalCommissionsPaid || 0,
    totalTaxesPaid: db.portfolio.totalTaxesPaid || 0,
    totalRealizedPL: db.portfolio.totalRealizedPL || 0,
    totalCosts: (db.portfolio.totalCommissionsPaid || 0) + (db.portfolio.totalTaxesPaid || 0)
  };
}

// Holdings functions
export function getHoldings() {
  return db.holdings.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function getHolding(symbol) {
  return db.holdings.find(h => h.symbol === symbol.toUpperCase());
}

export function upsertHolding(symbol, shares, avgCost, takeProfit = null, stopLoss = null) {
  const upperSymbol = symbol.toUpperCase();

  if (shares <= 0) {
    db.holdings = db.holdings.filter(h => h.symbol !== upperSymbol);
    saveDb(db);
    return null;
  }

  const existing = db.holdings.find(h => h.symbol === upperSymbol);
  if (existing) {
    existing.shares = shares;
    existing.avg_cost = avgCost;
    // Only update TP/SL if provided
    if (takeProfit !== null) existing.take_profit = takeProfit;
    if (stopLoss !== null) existing.stop_loss = stopLoss;
    existing.updatedAt = new Date().toISOString();
  } else {
    db.holdings.push({
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

  saveDb(db);
  return getHolding(upperSymbol);
}

export function deleteHolding(symbol) {
  db.holdings = db.holdings.filter(h => h.symbol !== symbol.toUpperCase());
  saveDb(db);
}

// Trade history functions
export function getTrades(limit = 100) {
  return db.trades
    .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())
    .slice(0, limit);
}

export function addTrade(trade) {
  db.trades.push({
    ...trade,
    executed_at: new Date().toISOString()
  });
  saveDb(db);
  return trade;
}

// Watchlist functions
export function getWatchlist() {
  return db.watchlist.sort();
}

export function addToWatchlist(symbol) {
  const upperSymbol = symbol.toUpperCase();
  if (!db.watchlist.includes(upperSymbol)) {
    db.watchlist.push(upperSymbol);
    saveDb(db);
  }
  return true;
}

export function removeFromWatchlist(symbol) {
  db.watchlist = db.watchlist.filter(s => s !== symbol.toUpperCase());
  saveDb(db);
}

// Alert functions for auto-exit notifications
export function getAlerts(includeRead = false) {
  if (includeRead) {
    return db.alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return db.alerts
    .filter(a => !a.read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addAlert(alert) {
  const newAlert = {
    id: Date.now(),
    ...alert,
    read: false,
    created_at: new Date().toISOString()
  };
  db.alerts.push(newAlert);
  saveDb(db);
  return newAlert;
}

export function markAlertRead(alertId) {
  const alert = db.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.read = true;
    saveDb(db);
  }
  return alert;
}

export function markAllAlertsRead() {
  db.alerts.forEach(a => a.read = true);
  saveDb(db);
}

export function clearAlerts() {
  db.alerts = [];
  saveDb(db);
}

// Reset portfolio to initial state
export function resetPortfolio() {
  db = {
    portfolio: {
      cash: 100000,
      totalCommissionsPaid: 0,
      totalTaxesPaid: 0,
      totalRealizedPL: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    holdings: [],
    trades: [],
    watchlist: db.watchlist, // Keep watchlist
    alerts: [] // Clear alerts
  };
  saveDb(db);
  return db.portfolio;
}

export default db;
