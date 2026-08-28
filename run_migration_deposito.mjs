import { Client } from 'pg';

async function run() {
  const dbUrl = "postgresql://postgres:07052812Mv.@db.pxvhovctyewwppwkldaq.supabase.co:5432/postgres";
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log("Connected to DB");
    
    // 1. Add column
    await client.query(`
      ALTER TABLE inventory_items 
      ADD COLUMN IF NOT EXISTS deposit TEXT DEFAULT 'DEPOSITO RAWSON';
    `);
    console.log("Column 'deposit' added or already exists.");
    
    // 2. Migrate existing data
    await client.query(`
      UPDATE inventory_items 
      SET deposit = 'ALMACEN CENTRAL' 
      WHERE location ILIKE '%almacen%' OR location ILIKE '%central%';
    `);
    
    await client.query(`
      UPDATE inventory_items 
      SET deposit = 'DEPOSITO RAWSON' 
      WHERE deposit IS NULL OR (location ILIKE '%rawson%' OR location ILIKE '%panol%' OR location ILIKE '%pañol%');
    `);
    
    console.log("Data migration completed successfully.");
    
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
