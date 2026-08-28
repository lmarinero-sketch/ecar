import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pxvhovctyewwppwkldaq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhvdmN0eWV3d3Bwd2tsZGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcxNjc0NCwiZXhwIjoyMDgyMjkyNzQ0fQ.nQhpJ6t4KSn-uLlD1vTL_UzFVfgwal3yS4bN7WJpg3w'
);

async function run() {
  console.log("Querying locations...");
  const { data, error } = await supabase
    .from('inventory_items')
    .select('location');
    
  if (error) {
    console.error(error);
    return;
  }
  
  const unique = [...new Set(data.map(d => d.location))];
  console.log("Unique locations:", unique);
}

run();
