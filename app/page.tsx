'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts, processCheckout, getCategories } from './actions';
import { Button } from "@/components/ui/button";
import BarcodeScanner from './components/BarcodeScanner';
import OCRScanner from './components/OCRScanner';

type Product = { id: number; name: string; barcode: string; category: string; selling_price: number; stock: number; image?: string };
type CartItem = Product & { quantity: number };

export default function KasirPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbCategories, setDbCategories] = useState<{id: number, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Modal States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS/Card'>('Tunai');
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [transactionId, setTransactionId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showOCR, setShowOCR] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

async function loadProducts() {
    const data = await getProducts();
    const cats = await getCategories();
    // Gunakan trik JSON ini untuk membersihkan format data dari database
    setProducts(JSON.parse(JSON.stringify(data)));
    setDbCategories(cats);
  }

  const categories = ['All', ...dbCategories.map(c => c.name)];
  
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
      addToCart(product);
      setSearchQuery('');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    await processCheckout(cart, paymentMethod, totalAmount);
    alert('Transaksi Berhasil Disimpan!');
    setCart([]);
    setIsCheckoutModalOpen(false);
    setPaymentMethod('Tunai');
    setReceivedAmount('');
    await loadProducts();
    setLoading(false);
  };

  return (
    <div className="flex w-full h-full relative">
      
      {/* KIRI: Area Menu Utama */}
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <div className="flex flex-col justify-between items-start mb-6 md:mb-8 gap-4 w-full">
          <form onSubmit={handleBarcodeSubmit} className="relative w-full flex gap-2">
            <div className="relative w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                autoFocus
                placeholder="Scan barcode atau cari barang..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white border border-gray-100 rounded-full py-3 pl-12 pr-12 text-sm text-gray-800 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <button type="button" onClick={() => setShowScanner(true)} title="Scan Barcode" className="shrink-0 bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 font-bold px-4 rounded-full shadow-sm transition flex items-center justify-center whitespace-nowrap">
              📷
            </button>
            <button type="button" onClick={() => setShowOCR(true)} title="AI Scan Kemasan" className="shrink-0 bg-white border border-gray-100 hover:bg-blue-50 text-blue-600 font-bold px-4 rounded-full shadow-sm transition flex items-center justify-center whitespace-nowrap">
              ✨
            </button>
            <button type="button" onClick={() => router.push('/riwayat')} title="Riwayat Transaksi" className="shrink-0 bg-white border border-gray-100 hover:bg-gray-50 text-gray-500 font-bold px-4 rounded-full shadow-sm transition flex items-center justify-center whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </form>
          <div className="flex justify-between items-center w-full mt-1">
            {outOfStockCount > 0 && (
              <div className="text-primary font-semibold text-sm">{outOfStockCount} barang habis</div>
            )}
          </div>
          
          {showScanner && (
            <BarcodeScanner 
              onScanSuccess={(code) => {
                setSearchQuery(code);
                setShowScanner(false);
                const product = products.find(p => p.barcode === code);
                if (product) {
                  addToCart(product);
                  setSearchQuery('');
                }
              }}
              onClose={() => setShowScanner(false)}
            />
          )}

          {showOCR && (
            <OCRScanner 
              products={products}
              onScanSuccess={(product) => {
                addToCart(product);
                setShowOCR(false);
                alert(`✨ ${product.name} otomatis ditambahkan ke keranjang!`);
              }}
              onClose={() => setShowOCR(false)}
            />
          )}
        </div>

        {/* Filter Kategori Desktop */}
        <div className="hidden md:flex gap-4 mb-8 overflow-x-auto pb-2 shrink-0 min-h-[48px] items-center">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm border ${activeCategory === cat ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}>
              <span>{cat === 'All' ? '📦' : '🏷️'}</span> {cat}
            </button>
          ))}
        </div>

        {/* Filter Kategori Mobile */}
        <div className="md:hidden mb-6 relative">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-bold text-gray-700 shadow-sm appearance-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={`mob-cat-${cat}`} value={cat}>{cat === 'All' ? '📦 Semua Produk' : `🏷️ ${cat}`}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Daftar {activeCategory === 'All' ? 'Barang' : activeCategory}</h2>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">{filteredProducts.length} Ditemukan</span>
            <div className="flex bg-white rounded-xl border border-gray-100 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {/* Icon Grid */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {/* Icon List */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Konten Produk */}
        <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10" : "flex flex-col gap-4 pb-10"}>
          {filteredProducts.map(p => {
            if (viewMode === 'grid') {
              return (
                <div key={p.id} onClick={() => addToCart(p)} className={`bg-white rounded-[20px] p-3 flex flex-col items-start text-left shadow-sm border border-gray-100 transition cursor-pointer hover:shadow-md hover:border-primary/20 overflow-hidden relative`}>
                  <div className="w-full aspect-[4/3] bg-[#f8f9fa] rounded-xl mb-3 overflow-hidden flex items-center justify-center relative border border-gray-50">
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded shadow-sm text-[10px] font-bold z-10 ${p.stock <= 5 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-[#ffc107] text-yellow-900 border border-yellow-400'}`}>
                       {p.stock <= 5 && <span className="mr-1">⚠️</span>}
                       Stok: {p.stock}
                    </div>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <span className="text-gray-300 text-3xl">📷</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug px-1 text-sm">{p.name}</h3>
                  <p className="text-primary font-bold text-base px-1 mt-auto pt-1">Rp {p.selling_price.toLocaleString('id-ID')}</p>
                </div>
              );
            } else {
              return (
                <div key={p.id} onClick={() => addToCart(p)} className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 transition cursor-pointer hover:shadow-md hover:border-primary/20`}>
                  <div className="w-16 h-16 bg-gray-50 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xl">📷</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{p.category} &bull; Stok: {p.stock}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-green-600 font-bold text-lg">Rp {p.selling_price.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* TOMBOL CART MOBILE */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 z-30">
        <div 
          onClick={() => setIsMobileCartOpen(true)} 
          className="bg-primary hover:bg-primary/90 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between cursor-pointer transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
             <div className="relative">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               {cart.length > 0 && (
                 <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary">
                   {cart.reduce((a,b)=>a+b.quantity, 0)}
                 </span>
               )}
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] text-white/80 font-medium tracking-wide">Total Tagihan</span>
               <span className="text-lg font-bold leading-none mt-1">Rp {totalAmount.toLocaleString('id-ID')}</span>
             </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition">
            Bayar <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* KANAN: Panel Keranjang */}
      <div className={`fixed inset-0 z-40 bg-white flex-col md:static md:w-96 md:bg-white md:border-l md:border-gray-100 md:flex shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] ${isMobileCartOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-6 md:p-8 pb-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 md:pb-6">
            <h2 className="text-xl font-bold text-gray-800">Keranjang Belanja</h2>
            <button className="md:hidden p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition" onClick={() => setIsMobileCartOpen(false)}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-10">Belum ada barang di keranjang.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                  <p className="font-bold text-green-600 text-sm mt-1">Rp {item.selling_price.toLocaleString('id-ID')}</p>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-gray-700 font-bold hover:bg-primary/20">-</button>
                      <span className="font-bold text-sm w-4 text-center text-gray-800">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-gray-700 font-bold hover:bg-primary/20">+</button>
                    </div>
                    <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-gray-500 hover:text-red-600 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 pb-28 md:pb-8 bg-white border-t border-gray-100">
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
          <Button onClick={() => setIsCheckoutModalOpen(true)} disabled={loading || cart.length === 0} className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/30">
            Selesaikan Pembayaran
          </Button>
        </div>

      </div>

      {/* MODAL PEMBAYARAN */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-800 rounded-[32px] w-full max-w-[500px] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Pembayaran</h2>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[85vh]">
              {/* Total Tagihan */}
              <div className="bg-primary/10 rounded-[24px] p-6 flex flex-col items-center justify-center border border-primary/10">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Tagihan</p>
                <p className="text-4xl font-black text-green-600">Rp {totalAmount.toLocaleString('id-ID')}</p>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-4">
                {(['Tunai', 'QRIS/Card'] as const).map(method => {
                  const isActive = paymentMethod === method;
                  let bgClass = 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50';
                  if (isActive) {
                    bgClass = 'bg-primary/10 border-primary text-primary shadow-sm';
                  }
                  
                  return (
                    <button 
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-col items-center justify-center p-5 rounded-[24px] border-2 transition ${bgClass}`}
                    >
                      {/* Icons */}
                      {method === 'Tunai' && <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                      {method === 'QRIS/Card' && <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                      <span className="font-bold">{method}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Content */}
              {paymentMethod === 'Tunai' ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Uang Tunai Diterima</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">Rp</span>
                      <input 
                        type="number" 
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-white border border-gray-200 rounded-[20px] py-4 pl-14 pr-4 text-gray-800 text-2xl font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => setReceivedAmount(totalAmount)} className="bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-gray-200 text-sm py-3 rounded-[16px] font-bold text-gray-600 transition shadow-sm">Uang Pas</button>
                    <button onClick={() => setReceivedAmount(20000)} className="bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-gray-200 text-sm py-3 rounded-[16px] font-bold text-gray-600 transition shadow-sm">20.000</button>
                    <button onClick={() => setReceivedAmount(50000)} className="bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-gray-200 text-sm py-3 rounded-[16px] font-bold text-gray-600 transition shadow-sm">50.000</button>
                    <button onClick={() => setReceivedAmount(100000)} className="bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-gray-200 text-sm py-3 rounded-[16px] font-bold text-gray-600 transition shadow-sm">100.000</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Nominal Transaksi</label>
                    <input 
                      type="text" 
                      value={`Rp ${totalAmount.toLocaleString('id-ID')}`}
                      readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded-[20px] py-4 px-5 text-gray-500 text-xl font-bold focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Bukti Pembayaran (Opsional)</label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-[20px] p-2 hover:bg-gray-50 transition bg-white">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-green-100 transition cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Kembalian */}
              <div className="flex justify-between items-center p-5 bg-gray-50 border border-gray-100 rounded-[24px]">
                <span className="text-gray-600 font-bold">Kembalian</span>
                <span className="text-[#16a34a] font-black text-2xl">
                  Rp {paymentMethod === 'Tunai' ? Math.max(0, (Number(receivedAmount) || 0) - totalAmount).toLocaleString('id-ID') : '0'}
                </span>
              </div>
              
              <Button 
                onClick={handleCheckout} 
                disabled={loading || (paymentMethod === 'Tunai' && (Number(receivedAmount) || 0) < totalAmount)}
                className="w-full h-14 rounded-[20px] font-bold text-base shadow-lg shadow-primary/30"
              >
                {loading ? 'Memproses...' : 'Selesaikan Transaksi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}