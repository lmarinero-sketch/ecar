import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pxvhovctyewwppwkldaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhvdmN0eWV3d3Bwd2tsZGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcxNjc0NCwiZXhwIjoyMDgyMjkyNzQ0fQ.nQhpJ6t4KSn-uLlD1vTL_UzFVfgwal3yS4bN7WJpg3w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: countData, error: countError, count } = await supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true });
    
  if (countError) console.error('Count error:', countError);
  console.log('Total items:', count);

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(5);

  if (tenantsError) console.error('Tenants error:', tenantsError);
  console.log('Tenants:', tenants);
}

run();
