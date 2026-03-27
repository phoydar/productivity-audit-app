#!/usr/bin/env node
/**
 * One-time migration script: reads local SQLite DB and POSTs all data
 * to the cloud /api/admin/restore endpoint.
 *
 * Usage:
 *   node scripts/migrate-to-cloud.mjs <CLOUD_URL> <API_SECRET>
 *
 * Example:
 *   node scripts/migrate-to-cloud.mjs https://adorable-sparkle-production-7b6f.up.railway.app your-api-secret
 */
import { createClient } from '@libsql/client';

const [,, cloudUrl, apiSecret] = process.argv;

if (!cloudUrl || !apiSecret) {
  console.error('Usage: node scripts/migrate-to-cloud.mjs <CLOUD_URL> <API_SECRET>');
  process.exit(1);
}

const localDb = createClient({ url: 'file:./data/productivity-audit.db' });

async function dump(table) {
  try {
    const result = await localDb.execute(`SELECT * FROM ${table}`);
    return result.rows;
  } catch {
    return [];
  }
}

async function main() {
  console.log('Reading local database...');

  const tables = {
    daily_log: await dump('daily_log'),
    log_entry: await dump('log_entry'),
    tag: await dump('tag'),
    entry_tag: await dump('entry_tag'),
    insight: await dump('insight'),
    todo: await dump('todo'),
    settings: await dump('settings'),
  };

  const counts = Object.entries(tables).map(([k, v]) => `${k}: ${v.length}`).join(', ');
  console.log(`Found: ${counts}`);

  const totalRows = Object.values(tables).reduce((sum, rows) => sum + rows.length, 0);
  if (totalRows === 0) {
    console.log('No data to migrate.');
    return;
  }

  console.log(`Posting to ${cloudUrl}/api/admin/restore ...`);

  const res = await fetch(`${cloudUrl}/api/admin/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': apiSecret,
    },
    body: JSON.stringify({ tables }),
  });

  const body = await res.json();

  if (res.ok) {
    console.log('Migration successful!', body);
  } else {
    console.error('Migration failed:', body);
    process.exit(1);
  }
}

main();
