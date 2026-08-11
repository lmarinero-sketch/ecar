const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres",
});

async function setup() {
  await client.connect();
  console.log("Connected to PostgreSQL");
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS gasto_categorias_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        categoria_key TEXT NOT NULL,
        custom_label TEXT NOT NULL,
        UNIQUE(tenant_id, categoria_key)
      );
      
      ALTER TABLE gasto_categorias_config ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Permitir todo config" ON gasto_categorias_config;
      CREATE POLICY "Permitir todo config" ON gasto_categorias_config FOR ALL USING (true);
    `);
    console.log("Table created and RLS policy applied.");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

setup();
