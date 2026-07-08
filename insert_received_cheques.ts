import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim().replace(/^"|'/, '').replace(/"|'$/, '');
  }
});

const supabaseUrl = env['SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ECAR_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

const checksToInsert = [
  { 
    cheque_number: 'REC_VALDIVIESO_01', 
    bank_name: 'Desconocido', 
    type: 'echeq', 
    direction: 'receivable', 
    beneficiary_or_issuer: 'Valdivieso Group SRL', 
    amount_ars: 6082241.82, 
    due_date: '2026-07-05', 
    issue_date: '2026-07-05',
    status: 'deposited' 
  },
  { 
    cheque_number: 'REC_BORREGO_01', 
    bank_name: 'Desconocido', 
    type: 'echeq', 
    direction: 'receivable', 
    beneficiary_or_issuer: 'BORREGO SRL', 
    amount_ars: 10125000.00, 
    due_date: '2026-07-20', 
    issue_date: '2026-07-20',
    status: 'pending' // ACEPTADO in UI usually means pending/cashed later, pending is the default.
  }
].map(c => ({ ...c, tenant_id: ECAR_TENANT_ID }));

async function run() {
  const { data, error } = await supabase.from('cheques').insert(checksToInsert).select();
  if (error) {
    console.error("Error inserting checks:", error);
  } else {
    console.log("Successfully inserted checks:", data.length);
  }
}
run();
