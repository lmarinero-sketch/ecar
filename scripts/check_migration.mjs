import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pxvhovctyewwppwkldaq.supabase.co',
  'sb_publishable_g69DX3OvYEfAudoOH2fsMw_ndQc6EGl'
);

async function migrate() {
  // Test if column exists by attempting a query
  const { error } = await supabase.from('obligation_payments').select('period_month').limit(1);
  if (error && error.message.includes('period_month')) {
    console.log('Column period_month does not exist yet. Please run migration via Supabase Dashboard SQL Editor:');
    console.log(`ALTER TABLE obligation_payments ADD COLUMN IF NOT EXISTS period_month TEXT;`);
    console.log(`CREATE INDEX IF NOT EXISTS idx_obligation_payments_period ON obligation_payments(obligation_id, period_month);`);
  } else {
    console.log('Column period_month already exists or query succeeded. Migration not needed.');
  }
}

migrate();
