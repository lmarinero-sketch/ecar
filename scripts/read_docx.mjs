import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\lucas\\Desktop\\Proyectos\\Ecar\\1 - ECAR_Manual_Organizacion_Indice_Mapa_Procesos_v2_Premium.docx',
  'C:\\Users\\lucas\\Desktop\\Proyectos\\Ecar\\2 - ECAR_Procedimiento_Gerencia_Proyectos_Presupuestos_v2_Premium.docx',
  'C:\\Users\\lucas\\Desktop\\Proyectos\\Ecar\\3 - ECAR_Procedimiento_Gerencia_Compras_v2_Premium.docx',
  'C:\\Users\\lucas\\Desktop\\Proyectos\\Ecar\\4- ECAR_Procedimiento_Gerencia_Logistica_v3_Premium.docx',
  'C:\\Users\\lucas\\Desktop\\Proyectos\\Ecar\\5 - ECAR_Procedimiento_Gerencia_Obras_v1_Premium.docx',
];

const outputDir = 'C:\\Users\\lucas\\Desktop\\Proyectos\\Ecar\\scripts\\docx_output';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

for (const filePath of files) {
  const basename = path.basename(filePath, '.docx');
  console.log(`\n===== Processing: ${basename} =====`);
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const outputPath = path.join(outputDir, `${basename}.txt`);
    fs.writeFileSync(outputPath, text, 'utf-8');
    console.log(`  -> Extracted ${text.length} chars -> ${outputPath}`);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
  }
}

console.log('\nDone!');
