import fs from 'fs';

// Read env vars from .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const PROJECT_REF = envVars.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = envVars.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN in .env');
  process.exit(1);
}

const sql = fs.readFileSync('supabase/migrations/20260615_business_process_tables.sql', 'utf-8');

async function main() {
  console.log('Sending full migration SQL as single query...');
  console.log(`SQL length: ${sql.length} chars`);
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text.substring(0, 2000)}`);
  
  if (res.status === 200 || res.status === 201) {
    console.log('\n✅ Migration executed successfully!');
  } else {
    console.log('\n❌ Migration failed.');
  }
}

main();
