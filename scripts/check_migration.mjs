import { readFileSync } from 'fs';

// Read .env manually
const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = env.SUPABASE_PROJECT_REF;

async function migrate() {
  // Check if column exists using service role
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/obligation_payments?select=period_month&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE,
      'Authorization': `Bearer ${SERVICE_ROLE}`,
    },
  });
  const testBody = await testRes.text();
  
  if (testRes.status !== 200 && testBody.includes('period_month')) {
    console.log('Column period_month does not exist. Running migration...');
  } else if (testRes.ok) {
    console.log('Column period_month already exists! No migration needed.');
    return;
  }

  // Use Supabase Management API to run SQL
  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'ALTER TABLE obligation_payments ADD COLUMN IF NOT EXISTS period_month TEXT; CREATE INDEX IF NOT EXISTS idx_obligation_payments_period ON obligation_payments(obligation_id, period_month);'
      }),
    }
  );
  const data = await mgmtRes.json();
  console.log('Status:', mgmtRes.status);
  console.log('Result:', JSON.stringify(data, null, 2));
}

migrate().catch(console.error);
