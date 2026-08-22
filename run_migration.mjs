import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const connectionString = 'postgresql://postgres.pxvhovctyewwppwkldaq:07052812Mv.@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    
    const sql = fs.readFileSync('supabase/migrations/20260822000000_add_iva_rate_to_purchase_items.sql', 'utf8');
    
    await client.query(sql);
    console.log('Migration for purchase_invoice_items iva_rate applied successfully.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
