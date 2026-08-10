const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  let code = fs.readFileSync(filePath, 'utf-8');
  let original = code;

  // Replace todayStr initialization
  code = code.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, "new Date(new Date().getTime() + 8 * 3600 * 1000).toISOString().split('T')[0]");

  // Replace new Date(something.created_at) with new Date(something.created_at + 'Z')
  code = code.replace(/new Date\(([\w\.]+created_at)\)/g, "new Date($1 + 'Z')");
  
  // Replace new Date(label) in laporan/page.tsx (if label comes from date grouping)
  code = code.replace(/new Date\(label\)/g, "new Date(label + 'T00:00:00Z')");
  
  // Replace new Date(tick) in laporan/page.tsx
  code = code.replace(/new Date\(tick\)/g, "new Date(tick + 'T00:00:00Z')");

  // Replace new Date(inv.date) in laporan/page.tsx
  code = code.replace(/new Date\(inv\.date\)/g, "new Date(inv.date + 'T00:00:00Z')");
  
  // In laporan/page.tsx, start and end dates are generated using new Date()
  // They are passed to getChartData. Let's fix them to UTC+8.
  code = code.replace(/const start = new Date\(\);/g, "const start = new Date(new Date().getTime() + 8 * 3600 * 1000);");
  code = code.replace(/const end = new Date\(\);/g, "const end = new Date(new Date().getTime() + 8 * 3600 * 1000);");

  if (code !== original) {
    fs.writeFileSync(filePath, code);
    console.log('Updated ' + filePath);
  }
}

walkDir('app', processFile);
