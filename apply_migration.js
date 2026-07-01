import pg from 'pg';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n\r]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;

const { Client } = pg;
const client = new Client({
  connectionString: dbUrl,
});

async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync('./supabase/migrations/20260701000000_add_project_fields.sql', 'utf8');
    await client.query(sql);
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

run();
