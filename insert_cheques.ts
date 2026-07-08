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
  { cheque_number: 'ECHEQ_ARM', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'ARMETAL', amount_ars: 600000.00, due_date: '2026-06-08', status: 'pending' },
  { cheque_number: '806', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'TAXI EXPRESS', amount_ars: 254100.00, due_date: '2026-06-22', status: 'pending' },
  { cheque_number: '808', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'KATSUDA', amount_ars: 1566109.00, due_date: '2026-07-03', status: 'pending' },
  { cheque_number: 'ECHEQ_DEC', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'DECOM', amount_ars: 2036736.13, due_date: '2026-07-05', status: 'pending' },
  { cheque_number: '574', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'MATRIGAS', amount_ars: 219000.00, due_date: '2026-07-05', status: 'pending' },
  { cheque_number: '814', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'DIEGO MECANICO', amount_ars: 810700.00, due_date: '2026-07-05', status: 'pending' },
  { cheque_number: '562', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'SJO', amount_ars: 1297429.00, due_date: '2026-07-10', status: 'pending' },
  { cheque_number: '573', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'JANIN AISLANTES', amount_ars: 1940859.00, due_date: '2026-07-15', status: 'pending' },
  { cheque_number: '809', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'KATSUDA', amount_ars: 1566109.04, due_date: '2026-07-18', status: 'pending' },
  { cheque_number: 'ECHEQ_ALU', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'ALUHOME', amount_ars: 2800000.00, due_date: '2026-07-21', status: 'pending' },
  { cheque_number: '810', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'BENAVIDEZ', amount_ars: 600000.00, due_date: '2026-07-22', status: 'pending' },
  { cheque_number: '812', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'JOSE FRIAS(LONKING)', amount_ars: 230000.00, due_date: '2026-07-22', status: 'pending' },
  { cheque_number: 'ECHEQ_UOC_JUL', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'UOCRA', amount_ars: 206505.25, due_date: '2026-07-29', status: 'pending' },
  { cheque_number: 'ECHEQ_OSP_JUL', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'OSPECON', amount_ars: 167036.50, due_date: '2026-07-29', status: 'pending' },
  { cheque_number: 'ECHEQ_DAN', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'DANIEL BOLLATTI', amount_ars: 409800.00, due_date: '2026-07-31', status: 'pending' },
  { cheque_number: '563', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'SJO', amount_ars: 1297429.00, due_date: '2026-08-10', status: 'pending' },
  { cheque_number: '811', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'BENAVIDEZ', amount_ars: 603336.83, due_date: '2026-08-10', status: 'pending' },
  { cheque_number: '575', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'ALUMETAL', amount_ars: 2797500.00, due_date: '2026-08-10', status: 'pending' },
  { cheque_number: '816', bank_name: 'Banco San Juan', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'JANIN AISLANTE', amount_ars: 2062497.00, due_date: '2026-08-20', status: 'pending' },
  { cheque_number: 'ECHEQ_ALU2', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'ALUHOME', amount_ars: 2800000.00, due_date: '2026-08-21', status: 'pending' },
  { cheque_number: 'ECHEQ_UOC_AGO', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'UOCRA', amount_ars: 206505.25, due_date: '2026-08-29', status: 'pending' },
  { cheque_number: 'ECHEQ_OSP_AGO', bank_name: 'Banco Santander', type: 'echeq', direction: 'payable', beneficiary_or_issuer: 'OSPECON', amount_ars: 167036.50, due_date: '2026-08-29', status: 'pending' },
  { cheque_number: '564', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'SJO', amount_ars: 1297429.00, due_date: '2026-09-10', status: 'pending' },
  { cheque_number: '576', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'ALUMETAL', amount_ars: 2797500.00, due_date: '2026-09-10', status: 'pending' },
  { cheque_number: '565', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'SJO', amount_ars: 1297429.00, due_date: '2026-10-10', status: 'pending' },
  { cheque_number: '566', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'SJO', amount_ars: 1297429.00, due_date: '2026-11-10', status: 'pending' },
  { cheque_number: '567', bank_name: 'Banco Santander', type: 'physical', direction: 'payable', beneficiary_or_issuer: 'SJO', amount_ars: 1297429.00, due_date: '2026-12-10', status: 'pending' }
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
