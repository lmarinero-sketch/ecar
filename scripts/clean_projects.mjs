import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const PROJECT_REF = envVars.SUPABASE_PROJECT_REF || (envVars.SUPABASE_URL ? envVars.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1] : null);
const ACCESS_TOKEN = envVars.SUPABASE_ACCESS_TOKEN;

async function main() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'DELETE FROM projects WHERE name IN (\'asd\', \'123\'); SELECT 1 as result;' })
  });
  console.log(await res.text());
}
main();
