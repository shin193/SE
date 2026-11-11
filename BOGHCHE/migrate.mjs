import { readFile, readdir } from 'node:fs/promises';
import { createPool } from './server/database.mjs';

const pool = createPool();
const directory = new URL('./db/migrations/', import.meta.url);
let client;
try {
  client = await pool.connect();
  await client.query('SELECT pg_advisory_lock(427631800)');
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const files = (await readdir(directory)).filter(name => /^\d+_[\w-]+\.sql$/.test(name)).sort();
  for (const filename of files) {
    const existing = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
    if (existing.rowCount) continue;
    const sql = await readFile(new URL(filename, directory), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log('Applied', filename);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
  console.log('Database is up to date.');
} catch (error) {
  console.error('Migration failed:', error.code ?? error.message);
  process.exitCode = 1;
} finally {
  if (client) client.release(true);
  await pool.end();
}
