const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { pattern: /bg-green-500/g, replacement: 'bg-primary' },
  { pattern: /bg-\[\#16a34a\]/g, replacement: 'bg-primary' },
  { pattern: /hover:bg-green-600/g, replacement: 'hover:bg-primary/90' },
  { pattern: /hover:bg-\[\#15803d\]/g, replacement: 'hover:bg-primary/90' },
  { pattern: /text-green-500/g, replacement: 'text-primary' },
  { pattern: /text-green-600/g, replacement: 'text-primary' },
  { pattern: /text-green-400/g, replacement: 'text-primary/80' },
  { pattern: /text-green-800/g, replacement: 'text-primary' },
  { pattern: /bg-green-50/g, replacement: 'bg-primary/10' },
  { pattern: /hover:bg-green-100/g, replacement: 'hover:bg-primary/20' },
  { pattern: /border-green-500/g, replacement: 'border-primary' },
  { pattern: /border-green-200/g, replacement: 'border-primary/20' },
  { pattern: /border-green-100/g, replacement: 'border-primary/10' },
  { pattern: /ring-green-500/g, replacement: 'ring-primary' },
  { pattern: /shadow-\[0_8px_20px_-6px_rgba\(22,163,74,0\.5\)\]/g, replacement: 'shadow-lg shadow-primary/30' },
  { pattern: /border-t-green-500/g, replacement: 'border-t-primary' },
  { pattern: /hover:border-green-500/g, replacement: 'hover:border-primary' },
  { pattern: /hover:border-green-200/g, replacement: 'hover:border-primary/20' },
  { pattern: /hover:text-green-600/g, replacement: 'hover:text-primary/90' },
  { pattern: /focus:border-green-500/g, replacement: 'focus:border-primary' },
  { pattern: /focus:ring-green-500\/10/g, replacement: 'focus:ring-primary/10' },
  { pattern: /focus:ring-green-500/g, replacement: 'focus:ring-primary' },
  { pattern: /group-hover:bg-green-100/g, replacement: 'group-hover:bg-primary/20' },
];

walk('app', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    replacements.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
