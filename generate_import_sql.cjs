const fs = require('fs');
const xlsx = require('xlsx');
const crypto = require('crypto');

const workbook = xlsx.readFile('planilla inventario fisica 1.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

const tenantId = 'a0000000-0000-0000-0000-000000000001';

// We map shelves by their code/number to a generated UUID
const shelves = {};
const items = [];

function generateUUID(seed) {
  // deterministic uuid based on seed
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
      shelves[shelfCode] = generateUUID(shelfCode);
    }
    shelfId = shelves[shelfCode];
    
    // Position format N<nivel>-C<bin>
    if (nivel || bin) {
      shelfPosition = `N${nivel || '1'}-C${bin || '1'}`;
    }
  }

  // map rubro to valid category
  const lowerRubro = rubro.toLowerCase();
  let category = 'material';
  if (lowerRubro.includes('herramienta')) category = 'herramienta';
  else if (lowerRubro.includes('consumible')) category = 'consumible';

  items.push({
    id: generateUUID(desc + '_' + rubro + '_' + (medida||'')),
    tenant_id: tenantId,
    name: desc.replace(/'/g, "''"),
    category: category,
    unit: medida.toString().replace(/'/g, "''"),
    current_stock: stock,
    shelf_id: shelfId,
    shelf_position: shelfPosition ? shelfPosition.replace(/'/g, "''") : null,
    notes: obs ? obs.toString().replace(/'/g, "''") : null
  });
}

// Generate SQL
let sql = '-- IMPORTACIÓN MASIVA DE INVENTARIO DESDE EXCEL\n\n';

sql += '-- 1. CREAR ESTANTERIAS\n';
for (const code in shelves) {
  const id = shelves[code];
  sql += `INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('${id}', '${tenantId}', '${code}', 'Estantería ${code.replace('E','')}', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;\n`;
}

sql += '\n-- 2. INSERTAR MATERIALES\n';
for (const item of items) {
  const shelfVal = item.shelf_id ? `'${item.shelf_id}'` : 'NULL';
  const posVal = item.shelf_position ? `'${item.shelf_position}'` : 'NULL';
  const notesVal = item.notes ? `'${item.notes}'` : 'NULL';
  
  sql += `INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('${item.id}', '${item.tenant_id}', '${item.name}', '${item.category}', '${item.unit}', ${item.current_stock}, ${shelfVal}, ${posVal}, ${notesVal})
ON CONFLICT (id) DO NOTHING;\n`;
}

fs.writeFileSync('import_inventory.sql', sql, 'utf8');
console.log('SQL generated at import_inventory.sql with', items.length, 'items.');
