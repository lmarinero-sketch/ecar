import fs from 'fs';
import path from 'path';
const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(f => {
  const fp = path.join(dir, f);
  let content = fs.readFileSync(fp, 'utf8');
  // Reemplaza algo como className="grid grid-cols-2 por className="grid grid-cols-1 md:grid-cols-2
  // Solo si no tiene ya un prefijo de responsividad md: o lg: o sm: delante del grid-cols-2
  const rx = /(className=[\"'\`][^\"'\`]*?)grid grid-cols-([2-9])(?!\s+md:grid-cols-|\s+lg:grid-cols-)/g;
  content = content.replace(rx, '$1grid grid-cols-1 md:grid-cols-$2');
  fs.writeFileSync(fp, content);
});
console.log('Done!');
