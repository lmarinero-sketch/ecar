import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    
    // Check if table exists
    const res = await client.query(`
      SELECT COUNT(*) FROM audit_logs;
    `);
    
    console.log('Total audit logs in DB:', res.rows[0].count);

    const res2 = await client.query(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
    `);

    console.log('Recent logs:', JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
