const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const srcFiles = getFiles('src').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
const tablesInSrc = new Set();
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match only supabase.from, ignore storage.from
  // We can just look for .from('...') and filter out ones that look like storage.from
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('.storage.from')) return;
    const matches = [...line.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)];
    matches.forEach(m => {
      tablesInSrc.add(m[1]);
    });
  });
});

console.log("Tables queried in frontend (excluding storage):");
console.log([...tablesInSrc].sort().join('\n'));

// Now check migrations for CREATE TABLE statements
function getMigrations(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (file.endsWith('.sql')) {
      results.push(file);
    }
  });
  return results;
}

const migrationFiles = getMigrations('supabase/migrations');
const tablesInMigrations = new Set();
migrationFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(\w+\.)?"?([a-zA-Z0-9_]+)"?/gi)];
  matches.forEach(m => {
    tablesInMigrations.add(m[3]);
  });
});

console.log("\nTables defined in migrations:");
console.log([...tablesInMigrations].sort().join('\n'));

console.log("\nMissing tables (queried but not found in migrations):");
[...tablesInSrc].forEach(t => {
  if (!tablesInMigrations.has(t)) {
    console.log(t);
  }
});
