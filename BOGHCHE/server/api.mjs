import { createAuth } from './auth.mjs';
import { listCategories, listProducts } from './catalog.mjs';
import { HttpError, json, readJson } from './http.mjs';

function integer(value, minimum) {
  if (!/^\d{1,10}$/.test(value ?? '')) throw new HttpError(400, 'INVALID_ID');
  const number = Number(value);
  if (number < minimum || number > 2147483647) throw new HttpError(400, 'INVALID_ID');
  return number;
}

function rateLimit() {
  const entries = new Map();
  const windowMs = 15 * 60 * 1000;
  let cleanupAt = 0;
  return (key, max) => {
    const now = Date.now();
    if (now > cleanupAt) {
      for (const [entry, value] of entries) if (value.until <= now) entries.delete(entry);
      cleanupAt = now + 60_000;
    }
    let entry = entries.get(key);
    if (!entry || entry.until <= now) {
      if (entries.size >= 10_000 && !entries.has(key)) throw new HttpError(429, 'RATE_LIMITED');
      entry = { count: 0, until: now + windowMs };
      entries.set(key, entry);
    }
    if (++entry.count > max) throw new HttpError(429, 'RATE_LIMITED');
  };
}

export function createApi(db, options) {
  const auth = createAuth(db, options);
  const limit = rateLimit();

  async function requireProduct(id) {
    const result = await db.query('SELECT 1 FROM products WHERE id = $1', [id]);
    if (!result.rowCount) throw new HttpError(404, 'PRODUCT_NOT_FOUND');
  }

  return async function api(req, res, url) {
    const pathname = url.pathname;
    const method = req.method;

    if (method === 'GET' && pathname === '/api/categories') {
      return json(res, 200, { categories: await listCategories(db) });
    }
    if (method === 'GET' && pathname === '/api/products') {
      const category = url.searchParams.has('category') ? integer(url.searchParams.get('category'), 0) : null;
      return json(res, 200, { products: await listProducts(db, { category }) });
    }
    const product = pathname.match(/^\/api\/products\/(\d+)$/);
    if (method === 'GET' && product) {
      const [record] = await listProducts(db, { id: integer(product[1], 1) });
      if (!record) throw new HttpError(404, 'PRODUCT_NOT_FOUND');
      return json(res, 200, { product: record });
    }

    if (method === 'GET' && pathname === '/api/auth/csrf') {
      return json(res, 200, { token: auth.issueCsrf(req, res) });
    }
    if (method === 'GET' && pathname === '/api/auth/session') {
      const user = await auth.session(req);
      if (!user) throw new HttpError(401, 'SIGN_IN_REQUIRED');
      return json(res, 200, { user: auth.publicUser(user) });
    }
    if (method === 'POST' && ['/api/auth/login', '/api/auth/signup', '/api/auth/logout', '/api/auth/password-reset'].includes(pathname)) {
      auth.verifyWrite(req);
      if (pathname.endsWith('/logout')) {
        await auth.logout(req, res);
        return json(res, 200, { ok: true });
      }
      if (pathname.endsWith('/password-reset')) throw new HttpError(501, 'RESET_NOT_CONFIGURED');
      limit('auth:' + req.socket.remoteAddress, 20);
      const signup = pathname.endsWith('/signup');
      const user = await auth.authenticate(req, res, await readJson(req), signup);
      return json(res, signup ? 201 : 200, { user });
    }

    const reviewRoute = pathname.match(/^\/api\/products\/(\d+)\/reviews(?:\/(\d+))?$/);
    if (reviewRoute) {
      const productId = integer(reviewRoute[1], 1);
      if (method === 'GET' && !reviewRoute[2]) {
        await requireProduct(productId);
        const user = await auth.session(req);
        const { rows } = await db.query(`
          SELECT r.id, a.name, r.rating, r.body AS text, r.updated_at AS date,
            (r.account_id = $2) IS TRUE AS mine
          FROM reviews r JOIN accounts a ON a.id = r.account_id
          WHERE r.product_id = $1 ORDER BY r.updated_at DESC, r.id DESC
        `, [productId, user?.id ?? null]);
        return json(res, 200, { reviews: rows });
      }
      if ((method === 'POST' && !reviewRoute[2]) || (method === 'DELETE' && reviewRoute[2])) {
        auth.verifyWrite(req);
        const user = await auth.session(req);
        if (!user) throw new HttpError(401, 'SIGN_IN_REQUIRED');
        limit('review:' + user.id, 30);
        if (method === 'DELETE') {
          const deleted = await db.query(
            'DELETE FROM reviews WHERE id = $1 AND product_id = $2 AND account_id = $3',
            [integer(reviewRoute[2], 1), productId, user.id]
          );
          if (!deleted.rowCount) throw new HttpError(404, 'REVIEW_NOT_FOUND');
          return json(res, 200, { ok: true });
        }

        const input = await readJson(req);
        const body = typeof input.text === 'string' ? input.text.trim() : '';
        const length = [...body].length;
        if (length < 10 || length > 1000 || body.includes('\0') ||
            !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
          throw new HttpError(400, 'INVALID_REVIEW');
        }
        await requireProduct(productId);
        const { rows } = await db.query(`
          INSERT INTO reviews (product_id, account_id, rating, body)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (product_id, account_id) DO UPDATE
            SET rating = EXCLUDED.rating, body = EXCLUDED.body, updated_at = now()
          RETURNING id
        `, [productId, user.id, input.rating, body]);
        return json(res, 200, { id: rows[0].id });
      }
    }
    throw new HttpError(404, 'ROUTE_NOT_FOUND');
  };
}
