'use client';

import { useState, useEffect } from 'react';
import { getProducts, processCheckout } from './actions';

type Product = { id: number; name: string; barcode: string; category: string; selling_price: number; stock: number };
type CartItem = Product & { quantity: number };

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    loadProducts();
  }, []);

async function loadProducts() {
    const data = await getProducts();
    // Gunakan trik JSON ini untuk membersihkan format data dari database
    setProducts(JSON.parse(JSON.stringify(data)));
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery));
    const matchCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const product = products.find(p => p.barcode === searchQuery.trim());
    if (product) {
      if (product.stock <= 0) alert(`Stok ${product.name} habis!`);
      else addToCart(product);
      setSearchQuery('');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 && newQ <= item.stock ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    await processCheckout(cart, 'Tunai', totalAmount);
    alert('Transaksi Berhasil Disimpan!');
    setCart([]);
    await loadProducts();
    setLoading(false);
  };

  return (
    <div className="flex w-full h-full">
      
      {/* KIRI: Area Menu Utama */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <form onSubmit={handleBarcodeSubmit} className="relative w-96">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              autoFocus
              placeholder="Scan barcode atau cari barang..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white border border-gray-100 rounded-full py-3 pl-12 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </form>
          {outOfStockCount > 0 && <div className="text-orange-500 font-semibold text-sm">{outOfStockCount} barang habis</div>}
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm border ${activeCategory === cat ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}>
              <span>{cat === 'All' ? '📦' : '🏷️'}</span> {cat}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Daftar {activeCategory === 'All' ? 'Barang' : activeCategory}</h2>
          <span className="text-sm text-gray-400 font-medium">{filteredProducts.length} Ditemukan</span>
        </div>

        {/* Grid Produk */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => p.stock > 0 && addToCart(p)} className={`bg-white rounded-[32px] p-6 flex flex-col items-center text-center shadow-sm border border-gray-100 transition ${p.stock > 0 ? 'cursor-pointer hover:shadow-md hover:border-orange-200' : 'opacity-50 cursor-not-allowed'}`}>
              
              {/* Inisial Placeholder Murni */}
              <div className="w-32 h-32 rounded-full bg-gray-50 border-4 border-white shadow-inner mb-4 flex items-center justify-center text-4xl overflow-hidden text-orange-400 font-black">
                {p.name.charAt(0).toUpperCase()}
              </div>
              
              <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{p.name}</h3>
              <p className="text-orange-500 font-bold text-lg mb-3">Rp {p.selling_price.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400 font-medium">Stok: {p.stock}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: Panel Keranjang */}
      <div className="w-96 bg-white border-l border-gray-100 flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] z-10 rounded-tr-[40px] rounded-br-[40px]">
        <div className="p-8 pb-4">
          <div className="flex justify-between items-start border-b border-gray-100 pb-6">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Transaksi Aktif</p>
              <h2 className="text-2xl font-black text-gray-800">#{Math.floor(100000 + Math.random() * 900000)}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium mb-1">Status</p>
              <h2 className="text-xl font-bold text-green-500">Kasir</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-10">Belum ada barang di keranjang.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4">
                
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex-shrink-0 flex items-center justify-center font-bold text-xl text-orange-400">
                  {item.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                  <p className="font-bold text-gray-800 text-sm mt-1">Rp {item.selling_price.toLocaleString('id-ID')}</p>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 font-bold hover:bg-orange-100">-</button>
                      <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 font-bold hover:bg-orange-100">+</button>
                    </div>
                    <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-gray-300 hover:text-red-500 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white border-t border-gray-100">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-500 font-medium">
              <span>Total Item</span>
              <span>{cart.reduce((a, b) => a + b.quantity, 0)} Pcs</span>
            </div>
            <div className="flex justify-between text-lg font-black text-gray-800 pt-2 border-t border-gray-100 border-dashed">
              <span>Total Bayar</span>
              <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={loading || cart.length === 0} className="w-full bg-[#EA7C2A] hover:bg-[#d66b1f] disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(234,124,42,0.5)]">
            {loading ? 'Memproses...' : 'Selesaikan Pembayaran'}
          </button>
        </div>

      </div>
    </div>
  );
}