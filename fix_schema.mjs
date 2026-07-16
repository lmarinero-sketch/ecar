import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Make sure the columns exist
    await client.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_category text;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_expiry date;
    `);
    console.log('Columns added successfully (or already existed).');

    // Reload the schema cache for PostgREST
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Schema cache reloaded successfully.');

  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

run();
