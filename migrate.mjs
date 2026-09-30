import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://ixjsftrwnjzsimkztuzv.supabase.co';
const key = 'sb_secret_aKLrfjLxcLhWd9VwxWilgw_OABTmtEj';
const db = createClient(url, key);

async function migrateTable(table) {
  const file = path.join(process.cwd(), 'data', table + '.json');
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('Migrating ' + data.length + ' rows to ' + table + '...');
  for (const row of data) {
    const id = row.id || 'site';
    const { error } = await db.from(table).upsert({ id, data: row });
    if (error) console.error(error.message);
  }
}

async function run() {
  await migrateTable('books');
  await migrateTable('videos');
  await migrateTable('readers');
  await migrateTable('settings');
}
run();
