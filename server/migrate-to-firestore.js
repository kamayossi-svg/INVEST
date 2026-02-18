/**
 * One-time migration script: data.json → Firestore
 * Run with: node migrate-to-firestore.js
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './firestore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, 'data.json');

async function migrate() {
  if (!existsSync(dataPath)) {
    console.log('No data.json found - nothing to migrate.');
    return;
  }

  const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
  console.log('Starting migration from data.json to Firestore...\n');

  // 1. Migrate portfolio
  if (data.portfolio) {
    await db.collection('portfolio').doc('main').set(data.portfolio);
    console.log(`✅ Portfolio migrated (cash: $${data.portfolio.cash})`);
  }

  // 2. Migrate holdings
  if (data.holdings && data.holdings.length > 0) {
    for (const holding of data.holdings) {
      await db.collection('holdings').doc(holding.symbol).set(holding);
    }
    console.log(`✅ ${data.holdings.length} holdings migrated`);
  } else {
    console.log('⏭️  No holdings to migrate');
  }

  // 3. Migrate trades
  if (data.trades && data.trades.length > 0) {
    for (const trade of data.trades) {
      await db.collection('trades').add(trade);
    }
    console.log(`✅ ${data.trades.length} trades migrated`);
  } else {
    console.log('⏭️  No trades to migrate');
  }

  // 4. Migrate watchlist
  if (data.watchlist && data.watchlist.length > 0) {
    await db.collection('watchlist').doc('symbols').set({ symbols: data.watchlist });
    console.log(`✅ Watchlist migrated (${data.watchlist.length} symbols)`);
  } else {
    console.log('⏭️  No watchlist to migrate');
  }

  // 5. Migrate alerts
  if (data.alerts && data.alerts.length > 0) {
    for (const alert of data.alerts) {
      await db.collection('alerts').add(alert);
    }
    console.log(`✅ ${data.alerts.length} alerts migrated`);
  } else {
    console.log('⏭️  No alerts to migrate');
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
