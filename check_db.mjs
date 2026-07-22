import pg from 'pg';
const { Client } = pg;
const connectionString = 'postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres';
const client = new Client({ connectionString });
async function run() {
  await client.connect();
  const res = await client.query('SELECT COUNT(*) FROM inventory_items');
  console.log('Total items:', res.rows[0].count);
  const res2 = await client.query('SELECT DISTINCT tenant_id FROM inventory_items');
  console.log('Tenant IDs in items:', res2.rows);
  const res3 = await client.query('SELECT id, name FROM tenants LIMIT 5');
  console.log('Tenants:', res3.rows);
  await client.end();
}
run();
