const fs = require('fs');
const xlsx = require('xlsx');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pxvhovctyewwppwkldaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhvdmN0eWV3d3Bwd2tsZGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcxNjc0NCwiZXhwIjoyMDgyMjkyNzQ0fQ.nQhpJ6t4KSn-uLlD1vTL_UzFVfgwal3yS4bN7WJpg3w';
const supabase = createClient(supabaseUrl, supabaseKey);

const workbook = xlsx.readFile('planilla inventario fisica 1.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

const tenantId = 'a0000000-0000-0000-0000-000000000001';

const shelves = {};
const shelvesData = [];
const items = [];

function generateUUID(seed) {
  const hash = crypto.createHash('md5').update(seed.toString()).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

for (const row of data) {
  const desc = row['Descripción'] || row['Descripcion'];
  if (!desc) continue;

  const rubro = row['Rubro'] || '';
  const stock = parseInt(row['Stock '] || row['Stock'] || '0') || 0;
  const medida = row['medida'] || 'unidad';
  const obs = row['observaciones'] || '';
  
  const estanteria = row['Estanteria'];
  const nivel = row['nivel'];
  const bin = row['bin'];

  let shelfId = null;
  let shelfPosition = null;

  if (estanteria) {
    const shelfCode = 'E' + estanteria;
    if (!shelves[shelfCode]) {
      const id = generateUUID(shelfCode);
      shelves[shelfCode] = id;
      shelvesData.push({
        id,
        tenant_id: tenantId,
        code: shelfCode,
        name: `Estantería ${shelfCode.replace('E','')}`,
        shelf_type: 'rack',
        color: '#3B82F6'
      });
    }
    shelfId = shelves[shelfCode];
    
    if (nivel || bin) {
      shelfPosition = `N${nivel || '1'}-C${bin || '1'}`;
    }
  }

  const lowerRubro = rubro.toLowerCase();
  let category = 'material';
  if (lowerRubro.includes('herramienta')) category = 'herramienta';
  else if (lowerRubro.includes('consumible')) category = 'consumible';

  items.push({
    id: generateUUID(desc + '_' + rubro + '_' + (medida||'')),
    tenant_id: tenantId,
    name: desc.toString(),
    category: category,
    unit: medida.toString(),
    current_stock: stock,
    shelf_id: shelfId,
    shelf_position: shelfPosition ? shelfPosition.toString() : null
  });
}

async function run() {
  console.log(`Upserting ${shelvesData.length} shelves...`);
  const { error: err1 } = await supabase.from('warehouse_shelves').upsert(shelvesData, { onConflict: 'id' });
  if (err1) {
    console.error('Error upserting shelves:', err1);
    return;
  }
  console.log('Shelves upserted!');

  const deduplicatedItemsMap = new Map();
  for (const item of items) {
    if (deduplicatedItemsMap.has(item.id)) {
      const existing = deduplicatedItemsMap.get(item.id);
      existing.current_stock += item.current_stock;
    } else {
      deduplicatedItemsMap.set(item.id, item);
    }
  }
  const uniqueItems = Array.from(deduplicatedItemsMap.values());
  console.log(`Upserting ${uniqueItems.length} unique items (from ${items.length} total)...`);
  
  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < uniqueItems.length; i += batchSize) {
    const batch = uniqueItems.slice(i, i + batchSize);
    const { error: err2 } = await supabase.from('inventory_items').upsert(batch, { onConflict: 'id' });
    if (err2) {
      console.error('Error upserting items batch:', i, err2);
    } else {
      console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}`);
    }
  }
  console.log('Done!');
}

run();
