/**
 * API authentication: a single shared password.
 *
 * Replaces the Firebase email/password login, which was heavier than a
 * single-user tool needs. What has NOT changed is that the server actually
 * verifies something - before any of this existed, every route including
 * /api/trade/buy and /api/portfolio/reset was open to anyone with the URL.
 *
 * Sign in once with the password, get a signed session token, and the client
 * sends that token on every request. The password itself is never stored
 * anywhere in the repo and never travels except on the login request.
 */
import crypto from 'crypto';

const APP_PASSWORD = process.env.APP_PASSWORD || '';

/**
 * Signing key for session tokens. Derived from the password when not set
 * explicitly, which gives a useful property for free: changing the password
 * invalidates every existing session.
 */
const SESSION_SECRET = process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`session:${APP_PASSWORD}`).digest('hex');

/** How long a session lasts before the password is needed again. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Brute-force protection. A shared password has no account to lock, so the
// limit is per client address.
const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

if (!APP_PASSWORD) {
  console.warn('⚠️  APP_PASSWORD is not set - the API will reject every login until it is');
} else {
  console.log('🔐 API protected by app password');
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payloadB64) {
  return base64url(crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest());
}

/** Compare without leaking length or content through timing. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so a wrong length isn't measurably faster.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionToken(ttlMs = SESSION_TTL_MS) {
  const payloadB64 = base64url(JSON.stringify({ exp: Date.now() + ttlMs }));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifySessionToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;
  if (!safeEqual(signature, sign(payloadB64))) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function rateLimited(req) {
  const key = clientKey(req);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(req) {
  const entry = attempts.get(clientKey(req));
  if (entry) entry.count++;
}

function clearFailures(req) {
  attempts.delete(clientKey(req));
}

/**
 * Exchange the app password for a session token.
 */
export function loginHandler(req, res) {
  if (!APP_PASSWORD) {
    return res.status(500).json({ success: false, error: 'Server has no password configured' });
  }
  if (rateLimited(req)) {
    return res.status(429).json({
      success: false,
      error: 'Too many attempts. Wait 15 minutes and try again.'
    });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !safeEqual(password, APP_PASSWORD)) {
    recordFailure(req);
    // Deliberately vague, and identical for "empty" and "wrong".
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  clearFailures(req);
  const token = createSessionToken();
  console.log('🔓 Successful login');
  res.json({ success: true, data: { token, expiresAt: Date.now() + SESSION_TTL_MS } });
}

/**
 * Gate every other API route on a valid session token.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  if (!verifySessionToken(token)) {
    return res.status(401).json({ success: false, error: 'Session expired - please sign in again' });
  }
  return next();
}
