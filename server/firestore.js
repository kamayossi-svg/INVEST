import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getCredential() {
  // Railway / production: read from env var
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envKey) {
    return admin.credential.cert(JSON.parse(envKey));
  }
  // Local development: read from file
  const localKey = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8')
  );
  return admin.credential.cert(localKey);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: getCredential(),
    projectId: 'invest-6f9ce'
  });
}

const db = admin.firestore();

export { db };
export default db;
