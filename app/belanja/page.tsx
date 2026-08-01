'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import BarcodeScanner from '../components/BarcodeScanner';
import { 
  getShoppingList, 
  generateShoppingList, 
  clearShoppingList, 
  toggleShoppingListItem, 
  deleteShoppingListItem,
  getProductsWithRecommendation,
  addToShoppingList
} from '../actions';

type ShoppingItem = {
  id: number;
  product_id: number;
  quantity: number;
  is_checked: number;
  name: string;
  barcode: string;
  stock: number;
  cost_price: number;
  selling_price: number;
  sold_last_7_days: number;
};

type Product = {
  id: number;
  name: string;
  barcode: string;
};

export default function BelanjaPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For manual add
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const list = await getShoppingList();
    setItems(list);
    const products = await getProductsWithRecommendation();
    setAllProducts(products.map((p: any) => ({ id: p.id, name: p.name, barcode: p.barcode || '' })));
    setLoading(false);
  }

  async function handleGenerate() {
    if (confirm('Sistem akan mencari barang dengan stok kritis dan menambahkannya ke daftar. Lanjutkan?')) {
      setLoading(true);
      await generateShoppingList();
      await loadData();
    }
  }

  async function handleClear() {
    if (confirm('Yakin ingin menghapus seluruh daftar belanja?')) {
      setLoading(true);
      await clearShoppingList();
      await loadData();
    }
  }

  async function handleToggle(id: number, currentStatus: number) {
    const isChecked = currentStatus === 1 ? false : true;
    // Optimistic update
    setItems(items.map(item => item.id === id ? { ...item, is_checked: isChecked ? 1 : 0 } : item));
    await toggleShoppingListItem(id, isChecked);
  }

  async function handleDelete(id: number) {
    if (confirm('Hapus barang ini dari daftar?')) {
      setItems(items.filter(item => item.id !== id));
      await deleteShoppingListItem(id);
    }
  }

  async function handleProductSelect(productId: string) {
    const qty = prompt('Jumlah yang akan dibeli:', '1');
    if (qty && !isNaN(Number(qty)) && Number(qty) > 0) {
      setLoading(true);
      await addToShoppingList(Number(productId), Number(qty));
      setSearchQuery('');
      setShowDropdown(false);
      await loadData();
    }
  }

  const uncompleted = items.filter(i => i.is_checked === 0);
  const completed = items.filter(i => i.is_checked === 1);

  return (
    <div className="flex w-full h-full p-4 md:p-8 overflow-y-auto pb-32 md:pb-8">
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800">🛒 Daftar Belanja</h1>
            <p className="text-gray-500 font-medium mt-1">Checklist barang saat Anda berada di toko grosir</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={handleClear} 
              className="font-bold px-6 py-3 rounded-2xl shadow-sm transition flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              🗑️ Kosongkan
            </Button>
            <Button 
              onClick={handleGenerate} 
              className="h-12 px-6 rounded-2xl text-base font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
            >
              ✨ Generate Otomatis
            </Button>
          </div>
        </div>

        {/* Manual Add Item */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Tambah Barang ke Daftar</label>
          <div className="flex gap-2 relative">
            <div className="relative w-full">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Ketik nama barang..." 
                className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 pr-12 text-sm font-semibold text-gray-800 focus:outline-none transition"
              />
              {searchQuery && (
                <button type="button" onMouseDown={(e) => { e.preventDefault(); setSearchQuery(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <Button type="button" onClick={() => setShowScanner(true)} className="shrink-0 h-[52px] px-4 rounded-2xl font-bold shadow-sm flex items-center justify-center whitespace-nowrap">
              📷 Scan
            </Button>

            {/* Dropdown Search */}
            {showDropdown && searchQuery && (
              <div className="absolute top-[60px] left-0 z-20 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                {allProducts
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery)))
                  .map(p => (
                    <div 
                      key={p.id} 
                      onMouseDown={(e) => { e.preventDefault(); handleProductSelect(p.id.toString()); }}
                      className="p-4 hover:bg-primary/10 cursor-pointer border-b border-gray-50 last:border-0 transition"
                    >
                      <div className="font-bold text-gray-800">{p.name}</div>
                      {p.barcode && <div className="text-xs text-gray-400 font-mono mt-1">{p.barcode}</div>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && items.length === 0 && (
          <div className="text-center py-10 text-gray-400 font-medium">Memuat daftar belanja...</div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Daftar Belanja Kosong</h3>
            <p className="text-gray-500 max-w-md mx-auto">Mulai tambahkan barang secara manual atau gunakan tombol di atas untuk mencari barang yang stoknya menipis.</p>
          </div>
        )}

        {/* Shopping List Items */}
        {items.length > 0 && (
          <div className="space-y-6">
            
            {/* Uncompleted Items */}
            {uncompleted.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 ml-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Belum Ditemukan ({uncompleted.length})
                </h3>
                <div className="space-y-3">
                  {uncompleted.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:border-primary/30">
                      <button 
                        onClick={() => handleToggle(item.id, item.is_checked)}
                        className="w-10 h-10 shrink-0 rounded-xl border-2 border-gray-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition"
                      >
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate text-lg">{item.name}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 md:gap-3 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md">Stok Toko: {item.stock}</span>
                          <span className="bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-md">Laku (7Hr): {item.sold_last_7_days}</span>
                          <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md">Beli: {item.quantity}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex gap-3 mt-1.5 font-medium">
                          <span>Beli Sblm: Rp {item.cost_price.toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>Jual Skrg: Rp {item.selling_price.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Items */}
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-3 ml-2 mt-8 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Sudah Di Troli ({completed.length})
                </h3>
                <div className="space-y-3 opacity-75">
                  {completed.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition">
                      <button 
                        onClick={() => handleToggle(item.id, item.is_checked)}
                        className="w-10 h-10 shrink-0 rounded-xl bg-green-500 border-2 border-green-500 text-white flex items-center justify-center transition shadow-inner shadow-black/10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-500 truncate text-lg line-through">{item.name}</div>
                        <div className="text-xs text-gray-400 flex gap-3 mt-1">
                          <span>Beli: {item.quantity}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 flex gap-2 mt-1 opacity-75 font-medium">
                          <span>Harga Beli: Rp {item.cost_price.toLocaleString('id-ID')}</span>
                          <span>|</span>
                          <span>Harga Jual: Rp {item.selling_price.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={(code) => {
            const product = allProducts.find(p => p.barcode === code);
            if (product) {
              handleProductSelect(product.id.toString());
            } else {
              alert('Barcode tidak ditemukan di master produk!');
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
