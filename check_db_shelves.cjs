const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://pxvhovctyewwppwkldaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhvdmN0eWV3d3Bwd2tsZGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcxNjc0NCwiZXhwIjoyMDgyMjkyNzQ0fQ.nQhpJ6t4KSn-uLlD1vTL_UzFVfgwal3yS4bN7WJpg3w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: shelves, error } = await supabase.from('warehouse_shelves').select('*');
  if (error) {
    console.error('Error fetching shelves:', error);
    return;
  }
  console.log('Shelves in DB:');
  for (const s of shelves) {
    console.log(`${s.code} -> col: ${s.grid_col}, row: ${s.grid_row}, w: ${s.grid_width}, h: ${s.grid_height}`);
  }
}
run();
