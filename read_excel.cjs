const xlsx = require('xlsx');
const workbook = xlsx.readFile('planilla inventario fisica 1.xlsx');
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
  console.log("Sheet:", sheetName);
  for (let i = 0; i < Math.min(10, data.length); i++) {
    console.log(JSON.stringify(data[i]));
  }
}
