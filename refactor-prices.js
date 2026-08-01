const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('app', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');
    let changed = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("toLocaleString('id-ID')")) {
        if (lines[i].match(/text-(primary|gray-[0-9]{3})/)) {
          lines[i] = lines[i].replace(/text-(primary|gray-[0-9]{3})/g, 'text-green-600');
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
