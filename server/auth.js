/**
 * API authentication.
 *
 * The client has shipped a Firebase login screen since commit fb3d612, but the
 * server never verified anything: every route - including /api/trade/buy,
 * /api/trade/sell and /api/portfolio/reset - was reachable by anyone who knew
 * the URL. The login was decorative. This module makes it real.
 *
 * There is a single shared portfolio, so access is an allowlist rather than a
 * per-user data model. Set ALLOWED_UIDS to a comma-separated list of Firebase
 * UIDs; anyone else gets 403 even with a valid token from this project.
 */
import admin from 'firebase-admin';
// Imported for its side effect: it initialises the Firebase Admin app that
// admin.auth() below depends on.
import './firestore.js';

// Sign-up is open on this Firebase project, so "has a valid token" is not a
// sufficient check - anyone could register and reach the shared portfolio.
// These are the accounts that existed when the lock was added; override with
// ALLOWED_UIDS to change who has access.
const DEFAULT_ALLOWED_UIDS = [
  'DriBOEwM9TfMth3moAtBOJPkPYR2', // kamayossi@gmail.com - sole account on this project
];

const allowedUids = process.env.ALLOWED_UIDS
  ? process.env.ALLOWED_UIDS.split(',').map(s => s.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_UIDS;

console.log(`🔐 API locked to ${allowedUids.length} allowed account(s)`);

/**
 * Verify the Firebase ID token on the Authorization header.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    if (allowedUids.length > 0 && !allowedUids.includes(decoded.uid)) {
      console.warn(`⛔ Rejected request from non-allowlisted account ${decoded.email || decoded.uid}`);
      return res.status(403).json({ success: false, error: 'This account is not authorised for this portfolio' });
    }

    req.user = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (error) {
    const expired = error?.code === 'auth/id-token-expired';
    return res.status(401).json({
      success: false,
      error: expired ? 'Session expired - please sign in again' : 'Invalid authentication token'
    });
  }
}
