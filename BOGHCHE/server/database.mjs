import { loadEnvFile } from 'node:process';
import pg from 'pg';

try {
  loadEnvFile(new URL('../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

export function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required. See README.md.');
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 4000,
    statement_timeout: 5000
  });
  pool.on('error', error => console.error('PostgreSQL pool error:', error.code ?? error.name));
  return pool;
}
