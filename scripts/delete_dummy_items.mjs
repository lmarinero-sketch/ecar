import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const PROJECT_REF = envVars.SUPABASE_PROJECT_REF || (envVars.SUPABASE_URL ? envVars.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1] : null);
const ACCESS_TOKEN = envVars.SUPABASE_ACCESS_TOKEN;

const dummyNames = [
  'Taladro percutor Dewalt',
  'Rotomartillo Hilti',
  'Sierra circular 7 1/4',
  'Nivel láser Bosch',
  'Amoladora Bosch 7"',
  'Cemite bolsa 50kg',
  'Cemento bolsa 50kg',
  'Hierro 10mm x 12m',
  'Hierro 8mm x 12m',
  'Placas yeso 1.20x2.40',
  'Arena gruesa',
  'Piedra partida',
  'Caño PVC 110mm x 4m',
  'Cable 2.5mm rollo 100m',
  'Discos corte 7"',
  'Clavos 2.5"'
];

async function main() {
  const sqlNames = dummyNames.map(n => `'${n.replace(/'/g, "''")}'`).join(', ');
  const query = `
    DELETE FROM purchase_request_items WHERE inventory_item_id IN (SELECT id FROM inventory_items WHERE name IN (${sqlNames}));
    DELETE FROM logistics_delivery_items WHERE item_id IN (SELECT id FROM inventory_items WHERE name IN (${sqlNames}));
    DELETE FROM inventory_movements WHERE item_id IN (SELECT id FROM inventory_items WHERE name IN (${sqlNames}));
    DELETE FROM tool_assignments WHERE item_id IN (SELECT id FROM inventory_items WHERE name IN (${sqlNames}));
    DELETE FROM inventory_items WHERE name IN (${sqlNames});
  `;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  });
  console.log(await res.text());
}
main();
