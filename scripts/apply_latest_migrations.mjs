import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const PROJECT_REF = envVars.SUPABASE_PROJECT_REF || (envVars.SUPABASE_URL ? envVars.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1] : null);
const ACCESS_TOKEN = envVars.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('Missing SUPABASE_PROJECT_REF (or SUPABASE_URL) or SUPABASE_ACCESS_TOKEN in .env');
}

const queries = [
  fs.readFileSync('supabase/migrations/20260624_weekly_payments_init.sql', 'utf-8'),
  fs.readFileSync('supabase/migrations/20260624_weekly_payroll_details.sql', 'utf-8')
];

async function main() {
  for (let i = 0; i < queries.length; i++) {
    console.log(`Running query ${i + 1}/${queries.length}...`);
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: queries[i] }),
    });

    const text = await res.text();
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ Query ${i + 1} executed successfully!`);
    } else {
      console.log(`❌ Query ${i + 1} failed: ${res.status}`);
      console.log(`Response: ${text.substring(0, 1000)}`);
    }
  }
}

main();
