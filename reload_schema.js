import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    
    // Check if column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='employees' AND column_name='driver_license_category';
    `);
    
    if (res.rows.length > 0) {
      console.log('Column driver_license_category EXISTS.');
    } else {
      console.log('Column driver_license_category is MISSING. Adding it...');
      await client.query(`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_category text;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_expiry date;
      `);
      console.log('Columns added.');
    }

    // Reload PostgREST schema cache
    console.log('Reloading schema cache...');
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Schema cache reloaded successfully.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
