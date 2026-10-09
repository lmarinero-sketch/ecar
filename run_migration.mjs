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
    
    const sql = fs.readFileSync('supabase/migrations/20261008223000_add_saldo_generated_column.sql', 'utf8');
    
    await client.query(sql);
    console.log('Migration for saldo column applied successfully.');
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Schema reloaded successfully.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
