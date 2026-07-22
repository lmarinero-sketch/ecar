const xlsx = require('xlsx');
const workbook = xlsx.readFile('planilla inventario fisica 1.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

const shelves = {};

for (const row of data) {
  const estanteria = row['Estanteria'];
  const nivel = row['nivel'];
  const bin = row['bin'];

  if (estanteria) {
    const code = 'E' + estanteria;
    if (!shelves[code]) {
      shelves[code] = { levels: new Set(), bins: new Set(), count: 0 };
    }
    if (nivel) shelves[code].levels.add(nivel);
    if (bin) shelves[code].bins.add(bin);
    shelves[code].count++;
  }
}

for (const code in shelves) {
  console.log(`${code}: ${shelves[code].count} items, ${shelves[code].levels.size} levels, ${shelves[code].bins.size} bins`);
}
