import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './server/database.mjs';
import { createApi } from './server/api.mjs';
import { HttpError, json } from './server/http.mjs';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const publicOrigin = process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN) : null;
if (publicOrigin && !['http:', 'https:'].includes(publicOrigin.protocol)) throw new Error('Invalid PUBLIC_ORIGIN.');
if (process.env.NODE_ENV === 'production' && publicOrigin?.protocol !== 'https:') {
  throw new Error('Set PUBLIC_ORIGIN to your HTTPS origin in production.');
}
const allowedOrigins = publicOrigin ? [publicOrigin.origin] : [
  'http://127.0.0.1:' + port, 'http://localhost:' + port, 'http://[::1]:' + port
];
const pool = createPool();
const api = createApi(pool, { allowedOrigins, secure: publicOrigin?.protocol === 'https:' });

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer({ requestTimeout: 15_000 }, async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      await api(req, res, url);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new HttpError(404, 'NOT_FOUND');
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if (res.headersSent) { res.destroy(); return; }
    if (error instanceof HttpError) { json(res, error.status, { error: error.message }); return; }
    if (error.code === 'ENOENT' || error.code === 'EISDIR') { json(res, 404, { error: 'NOT_FOUND' }); return; }
    if (error instanceof URIError) { json(res, 400, { error: 'INVALID_PATH' }); return; }
    console.error('Request failed:', error.code ?? error.name);
    json(res, 503, { error: 'SERVICE_UNAVAILABLE' });
  }
});

try {
  await pool.query('SELECT 1 FROM products LIMIT 1');
  server.listen(port, host, () => console.log('Local: http://' + host + ':' + port));
} catch (error) {
  console.error('PostgreSQL startup failed:', error.code ?? error.name, 'Check DATABASE_URL and run node migrate.mjs.');
  await pool.end();
  process.exitCode = 1;
}
server.once('error', async error => {
  console.error('Server failed:', error.code ?? error.name);
  await pool.end();
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => void pool.end()));
}
