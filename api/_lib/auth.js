/**
 * Admin auth: one shared password, checked server-side, and a short-lived
 * signed session token (no database, no cookies).
 *
 * The password is hardcoded as a salted scrypt hash, not in plain text,
 * because this repo is public. Mayúsculas y espacios no importan
 * ("HANNAH 2026" == "hannah2026"). To change it without touching code, set
 * ADMIN_PASSWORD in Vercel's environment variables.
 */

import crypto from 'node:crypto';

const SALT = 'pf-admin-v1:d52899b60ecd4bc572d02274';
const PASSWORD_HASH = '1360ae199f1540921c4b84d33e029eda3a8641e4dfcd3751f1a1a15ee926673e';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const normalize = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '');
const hashPassword = (value) => crypto.scryptSync(normalize(value), SALT, 32);

export function checkPassword(input) {
  if (typeof input !== 'string' || !input || input.length > 200) return false;
  const expected = process.env.ADMIN_PASSWORD
    ? hashPassword(process.env.ADMIN_PASSWORD)
    : Buffer.from(PASSWORD_HASH, 'hex');
  return crypto.timingSafeEqual(hashPassword(input), expected);
}

/** Signing key: derived from server-only secrets when they exist. */
function sessionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.GITHUB_TOKEN || PASSWORD_HASH;
  return crypto.createHash('sha256').update(`pf-admin-session|${secret}|${process.env.ADMIN_PASSWORD || ''}`).digest();
}

const sign = (payload) => crypto.createHmac('sha256', sessionKey()).update(payload).digest('base64url');

export function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return { token: `${payload}.${sign(payload)}`, expiresIn: SESSION_TTL_MS };
}

export function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Ends the request with 401 unless it carries a valid session token. */
export function requireAuth(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (verifyToken(token)) return true;
  res.status(401).json({ error: 'Sesión vencida o inválida. Volvé a entrar.' });
  return false;
}
