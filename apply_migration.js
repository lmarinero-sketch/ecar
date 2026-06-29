import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync('./supabase/migrations/20260629191120_audit_logs.sql', 'utf8');
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

run();
