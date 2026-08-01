const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Restore files
require('child_process').execSync('git restore app/');

walk('app', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Global color replacements
    content = content.replace(/orange-/g, 'green-');
    content = content.replace(/#EA7C2A/gi, '#16a34a');
    content = content.replace(/#d66b1f/gi, '#15803d');
    content = content.replace(/rgba\(234,124,42/g, 'rgba(22,163,74');
    content = content.replace(/Sistem Kasir Modern/g, 'Kios Zaakiyah');
    
    // Layout tweaks
    if (filePath.replace(/\\/g, '/').includes('app/layout.tsx')) {
      content = content.replace('bg-[#EBE7E0] flex h-[100dvh] p-0 md:p-8 font-sans text-gray-800 overflow-hidden', 'bg-white flex h-[100dvh] font-sans text-gray-800 overflow-hidden');
      content = content.replace('bg-white md:rounded-[40px] shadow-none md:shadow-2xl overflow-hidden border-0 md:border border-gray-100 relative', 'bg-white overflow-hidden relative');
    }
    
    // Page tweaks
    if (filePath.replace(/\\/g, '/').endsWith('app/page.tsx')) {
      // transaction state
      content = content.replace(
        "const [receivedAmount, setReceivedAmount] = useState<number | ''>('');",
        "const [receivedAmount, setReceivedAmount] = useState<number | ''>('');\n  const [transactionId, setTransactionId] = useState('');"
      );
      content = content.replace(
        "useEffect(() => {\n    loadProducts();\n  }, []);",
        "useEffect(() => {\n    setTransactionId(Math.floor(100000 + Math.random() * 900000).toString());\n    loadProducts();\n  }, []);"
      );
      content = content.replace(
        /#{Math.floor\(100000 \+ Math.random\(\) \* 900000\)}/,
        "#{transactionId || '------'}"
      );
      
      // search bar
      content = content.replace(
        'className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4"',
        'className="flex flex-col justify-between items-start mb-6 md:mb-8 gap-4 w-full"'
      );
      content = content.replace(
        'className="relative w-full md:w-96"',
        'className="relative w-full"'
      );
      
      // categories
      content = content.replace(
        'className="flex gap-4 mb-8 overflow-x-auto pb-2"',
        'className="flex gap-4 mb-8 overflow-x-auto pb-2 shrink-0 min-h-[48px] items-center"'
      );
      content = content.replace(
        "className={`flex items-center gap-2",
        "className={`shrink-0 whitespace-nowrap flex items-center gap-2"
      );
      
      // remove cart curve
      content = content.replace(
        'md:rounded-tr-[40px] md:rounded-br-[40px] ',
        ''
      );
    }
    
    // Sidebar tweaks
    if (filePath.replace(/\\/g, '/').includes('app/Sidebar.tsx')) {
      content = content.replace('bg-green-100 text-green-600 rounded-full items-center justify-center font-black text-2xl mb-4', 'bg-amber-100 text-amber-600 rounded-full items-center justify-center font-black text-xl mb-4');
      content = content.replace('>\n        C\n      </div>', '>\n        KZ\n      </div>');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Fixed');
