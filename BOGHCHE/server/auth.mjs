import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './http.mjs';

const deriveKey = promisify(scrypt);
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const day = 86400;
let activeHashes = 0;

const randomToken = () => randomBytes(32).toString('base64url');
const digest = token => createHash('sha256').update(token).digest('hex');

async function derive(password, salt) {
  if (activeHashes >= 4) throw new HttpError(429, 'RATE_LIMITED');
  activeHashes++;
  try {
    return await deriveKey(password, salt, 64, scryptOptions);
  } finally {
    activeHashes--;
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return 'scrypt-v1:' + salt.toString('hex') + ':' + key.toString('hex');
}

async function verifyPassword(password, hash) {
  const [, salt, key] = hash?.split(':') ?? [];
  const expected = key ? Buffer.from(key, 'hex') : Buffer.alloc(64);
  const candidate = await derive(password, salt ? Buffer.from(salt, 'hex') : Buffer.alloc(16));
  return !!hash && expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

const controlCharacters = /[\u0000-\u001f\u007f]/u;
export function credentials(data, signup) {
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = data.password;
  if (email.length > 254 || controlCharacters.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new HttpError(400, 'INVALID_EMAIL');
  }
  if (typeof password !== 'string' || !password.length || password.length > 128) {
    throw new HttpError(400, 'INVALID_PASSWORD');
  }
  if (!signup) return { email, password, remember: data.remember === true };
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const nameLength = [...name].length;
  if (nameLength < 2 || nameLength > 60 || controlCharacters.test(name)) throw new HttpError(400, 'INVALID_NAME');
  if (password.length < 8 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) {
    throw new HttpError(400, 'INVALID_PASSWORD');
  }
  return { email, password, name, remember: false };
}

function cookieValue(req, name) {
  const pair = (req.headers.cookie ?? '').split(';').map(value => value.trim())
    .find(value => value.startsWith(name + '='));
  const token = pair?.slice(name.length + 1);
  return token && tokenPattern.test(token) ? token : null;
}

function publicUser(row) {
  return { name: row.name, email: row.email };
}

export function createAuth(db, { allowedOrigins, secure }) {
  const prefix = secure ? '__Host-' : '';
  const csrfName = prefix + 'boghche_csrf';
  const sessionName = prefix + 'boghche_session';
  const cookie = (name, value, seconds) =>
    name + '=' + value + '; Path=/; HttpOnly; SameSite=Lax' +
    (secure ? '; Secure' : '') + (seconds === undefined ? '' : '; Max-Age=' + seconds);

  function issueCsrf(req, res) {
    const existing = cookieValue(req, csrfName);
    if (existing) return existing;
    const token = randomToken();
    res.setHeader('Set-Cookie', cookie(csrfName, token, 1800));
    return token;
  }

  function verifyWrite(req) {
    if (!allowedOrigins.includes(req.headers.origin)) throw new HttpError(403, 'ORIGIN_REJECTED');
    const token = cookieValue(req, csrfName);
    const header = req.headers['x-csrf-token'];
    if (!token || typeof header !== 'string' || !tokenPattern.test(header) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(header))) throw new HttpError(403, 'CSRF_INVALID');
  }

  async function session(req) {
    const token = cookieValue(req, sessionName);
    if (!token) return null;
    const { rows } = await db.query(`
      SELECT a.id, a.name, a.email FROM sessions s JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = $1 AND s.expires_at > now()
    `, [digest(token)]);
    return rows[0] ?? null;
  }

  async function startSession(client, req, accountId, remember) {
    const old = cookieValue(req, sessionName);
    const token = randomToken();
    const duration = remember ? 30 * day : day / 2;
    await client.query('DELETE FROM sessions WHERE expires_at <= now() OR token_hash = $1', [old ? digest(old) : null]);
    await client.query(`
      INSERT INTO sessions (token_hash, account_id, expires_at)
      VALUES ($1, $2, now() + $3 * interval '1 second')
    `, [digest(token), accountId, duration]);
    return cookie(sessionName, token, remember ? duration : undefined);
  }

  async function authenticate(req, res, data, signup) {
    const input = credentials(data, signup);
    const hashed = signup ? await hashPassword(input.password) : null;
    let account;
    if (!signup) {
      const { rows } = await db.query('SELECT id, name, email, password_hash FROM accounts WHERE email = $1', [input.email]);
      account = rows[0];
      if (!await verifyPassword(input.password, account?.password_hash)) {
        throw new HttpError(401, 'INVALID_CREDENTIALS');
      }
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      if (signup) {
        const { rows } = await client.query(`
          INSERT INTO accounts (name, email, password_hash) VALUES ($1, $2, $3)
          ON CONFLICT (email) DO NOTHING RETURNING id, name, email
        `, [input.name, input.email, hashed]);
        account = rows[0];
        if (!account) throw new HttpError(409, 'EMAIL_EXISTS');
      }
      const sessionCookie = await startSession(client, req, account.id, input.remember);
      await client.query('COMMIT');
      res.setHeader('Set-Cookie', sessionCookie);
      return publicUser(account);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async function logout(req, res) {
    const token = cookieValue(req, sessionName);
    if (token) await db.query('DELETE FROM sessions WHERE token_hash = $1', [digest(token)]);
    res.setHeader('Set-Cookie', cookie(sessionName, '', 0));
  }

  return { issueCsrf, verifyWrite, session, authenticate, logout, publicUser };
}
