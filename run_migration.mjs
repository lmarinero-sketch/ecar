import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const connectionString = 'postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    
    const sql = fs.readFileSync('supabase/migrations/20260718002340_fix_audit_logs_rls.sql', 'utf8');
    
    await client.query(sql);
    console.log('Migration for audit_logs applied successfully.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
