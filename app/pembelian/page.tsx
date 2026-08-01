'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts, getRecentPurchases, processBulkPurchase, addProduct, getShoppingList, removeCheckedFromShoppingList } from '../actions';
import BarcodeScanner from '../components/BarcodeScanner';
import { Button } from "@/components/ui/button";

type Product = { id: number; name: string; stock: number; cost_price: number; selling_price: number; barcode: string; category: string };
type Purchase = { id: number; product_name: string; quantity: number; cost_price: number; total_cost: number; created_at: string; invoice_title?: string; supplier?: string };
type CartItem = { productId: number; name: string; barcode: string; quantity: number; costPrice: number; sellingPrice: number; oldStock: number };

export default function PembelianPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Invoice State
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [supplier, setSupplier] = useState('');
  const [discount, setDiscount] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Form State (Product Selection)
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({ productId: '', name: '', quantity: '', costPrice: '', sellingPrice: '', oldStock: 0 });

  // New Product Form State
  const [newProduct, setNewProduct] = useState({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '0' });
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const prods = await getProducts();
    const purchs = await getRecentPurchases();
    setProducts(JSON.parse(JSON.stringify(prods)));
    setPurchases(JSON.parse(JSON.stringify(purchs)));
  }

  const handleProductSelect = (id: string) => {
    const prod = products.find(p => p.id.toString() === id);
    if (prod) {
      setFormData({ 
        productId: id, 
        name: prod.name,
        quantity: '',
        costPrice: prod.cost_price.toString(),
        sellingPrice: prod.selling_price.toString(),
        oldStock: prod.stock
      });
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      const matched = products.find(p => p.barcode === searchQuery.trim());
      if (matched) {
        handleProductSelect(matched.id.toString());
      } else {
        const partialMatches = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery)));
        if (partialMatches.length === 1) {
          handleProductSelect(partialMatches[0].id.toString());
        }
      }
    }
  };

  const handleAddToCart = () => {
    if (!formData.productId || !formData.quantity || !formData.costPrice || !formData.sellingPrice) return alert('Lengkapi data barang terlebih dahulu!');
    
    setCart([...cart, {
      productId: Number(formData.productId),
      name: formData.name,
      barcode: '', // not strictly needed in cart display
      quantity: Number(formData.quantity),
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      oldStock: formData.oldStock
    }]);

    setFormData({ productId: '', name: '', quantity: '', costPrice: '', sellingPrice: '', oldStock: 0 });
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handlePullFromShoppingList = async () => {
    setLoading(true);
    const list = await getShoppingList();
    const checkedItems = list.filter((i: any) => i.is_checked === 1);
    
    if (checkedItems.length === 0) {
      alert('Tidak ada barang yang sudah dicentang di Daftar Belanja.');
      setLoading(false);
      return;
    }

    const newCartItems: CartItem[] = [];
    for (const item of checkedItems) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        newCartItems.push({
          productId: prod.id,
          name: prod.name,
          barcode: prod.barcode,
          quantity: item.quantity,
          costPrice: item.cost_price, 
          sellingPrice: item.selling_price,
          oldStock: item.stock
        });
      }
    }

    setCart(prev => {
      const merged = [...prev];
      for (const newItem of newCartItems) {
        const idx = merged.findIndex(c => c.productId === newItem.productId);
        if (idx >= 0) {
          merged[idx].quantity += newItem.quantity;
        } else {
          merged.push(newItem);
        }
      }
      return merged;
    });
    
    setLoading(false);
  };


  const handleBulkSubmit = async () => {
    if (cart.length === 0) return alert('Nota kosong! Tambahkan barang terlebih dahulu.');
    
    setLoading(true);
    await processBulkPurchase(invoiceTitle, supplier, cart, Number(discount));
    await removeCheckedFromShoppingList();
    
    // Reset Everything
    setInvoiceTitle('');
    setSupplier('');
    setDiscount('');
    setCart([]);
    setShowPurchaseModal(false);
    
    await loadData();
    alert('Pembelian nota berhasil dicatat!');
    setLoading(false);
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addProduct({
      name: newProduct.name,
      barcode: newProduct.barcode,
      category: newProduct.category,
      cost_price: Number(newProduct.cost_price),
      selling_price: Number(newProduct.selling_price),
      stock: Number(newProduct.stock)
    });
    
    await loadData();
    setShowAddProductModal(false);
    
    // Auto select the new product
    const updatedProds = await getProducts();
    const parsed = JSON.parse(JSON.stringify(updatedProds));
    const justAdded = parsed.find((p: any) => p.name === newProduct.name);
    if (justAdded) {
      handleProductSelect(justAdded.id.toString());
    }
    
    setNewProduct({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '0' });
    setLoading(false);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const cartGrandTotal = Math.max(0, cartSubtotal - Number(discount));

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="p-4 md:p-8 overflow-y-auto pb-24 flex-1">
        
        {/* HEADER UTAMA */}
        {!showPurchaseModal && (
          <div className="flex flex-col w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-800">📦 Pembelian & Restock</h1>
                <p className="text-gray-500 font-medium mt-1">Kelola stok masuk dan catat pengeluaran kulakan</p>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/belanja')} 
                  className="font-bold px-4 md:px-6 py-3 rounded-2xl shadow-sm transition flex items-center gap-2 text-primary border-primary hover:bg-primary/5"
                >
                  🛒 List Beli
                </Button>
                <Button onClick={() => setShowPurchaseModal(true)} className="font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/30 flex items-center gap-2">
                  + Tambah Nota
                </Button>
              </div>
            </div>

            {/* TABEL RIWAYAT KULAKAN (UTAMA) */}
            <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Riwayat Kulakan Terakhir</h2>
                <div className="relative w-full md:w-64">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Cari barang atau nota..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-9 pr-9 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition" />
                  {historySearch && (
                    <button type="button" onClick={() => setHistorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="min-w-[800px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Waktu & Nota</th>
                      <th className="text-left py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Barang</th>
                      <th className="text-center py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Qty Tambahan</th>
                      <th className="text-right py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Harga Beli Baru</th>
                      <th className="text-right py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-400">Belum ada riwayat pembelian.</td></tr>
                    ) : (
                      purchases
                        .filter(p => p.product_name.toLowerCase().includes(historySearch.toLowerCase()) || (p.invoice_title && p.invoice_title.toLowerCase().includes(historySearch.toLowerCase())))
                        .map(p => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                          <td className="py-4">
                            <div className="text-sm font-bold text-gray-800">{new Date(p.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</div>
                            <div className="text-xs text-gray-400 font-medium mt-1">
                              {p.invoice_title || 'Tanpa Nota'} - {p.supplier || 'Toko tidak diketahui'}
                            </div>
                          </td>
                          <td className="py-4 font-bold text-gray-800 text-sm">{p.product_name}</td>
                          <td className="py-4 text-center">
                            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm border border-primary/20">+{p.quantity}</span>
                          </td>
                          <td className="py-4 text-right text-green-600 font-medium text-sm">Rp {p.cost_price.toLocaleString('id-ID')}</td>
                          <td className="py-4 text-right font-black text-green-600 text-sm">Rp {p.total_cost.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL / HALAMAN FORM PEMBELIAN */}
        {showPurchaseModal && (
          <div className="flex flex-col w-full max-w-7xl mx-auto bg-white rounded-[32px] shadow-sm border border-gray-100 p-4 md:p-8 relative min-h-[80vh]">
            <Button variant="ghost" onClick={() => setShowPurchaseModal(false)} className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-400 hover:text-gray-800 rounded-full w-10 h-10 p-0 flex items-center justify-center transition bg-gray-100 hover:bg-gray-200">
              ✕
            </Button>
            
            <h2 className="text-2xl font-black text-gray-800 mb-2">Form Pembelian (Nota)</h2>
            <p className="text-gray-500 font-medium mb-8">Input barang-barang yang dibeli dari satu nota/supplier sekaligus.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Judul Nota / No. Invoice (Opsional)</label>
                <input 
                  type="text" 
                  value={invoiceTitle}
                  onChange={e => setInvoiceTitle(e.target.value)}
                  placeholder="Cth: INV-2023/10/01"
                  className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl p-3 text-sm font-semibold text-gray-800 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Sumber Toko / Supplier (Opsional)</label>
                <input 
                  type="text" 
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="Cth: Toko Sinar Jaya"
                  className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl p-3 text-sm font-semibold text-gray-800 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* KOLOM KIRI: INPUT BARANG */}
              <div className="w-full xl:w-1/3 flex flex-col gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Pilih Barang</h3>
                  </div>
                  
                  {!formData.productId ? (
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Cari / Scan Barcode</label>
                      <div className="flex gap-2">
                        <div className="relative w-full">
                          <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} 
                            onKeyDown={handleSearchEnter}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            placeholder="Ketik nama atau scan..." 
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 pr-12 text-sm font-semibold text-gray-800 focus:outline-none transition"
                          />
                          {searchQuery && (
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); setSearchQuery(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                        <Button type="button" onClick={() => setShowScanner(true)} className="shrink-0 h-[52px] px-4 rounded-2xl font-bold shadow-sm flex items-center justify-center whitespace-nowrap">
                          📷
                        </Button>
                      </div>
                      
                      {showDropdown && searchQuery && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                          {products
                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery)))
                            .map(p => (
                              <div 
                                key={p.id} 
                                onClick={() => handleProductSelect(p.id.toString())}
                                className="p-4 hover:bg-primary/10 cursor-pointer border-b border-gray-50 last:border-0 transition"
                              >
                                <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                <div className="text-xs text-gray-400 mt-1">Stok: {p.stock} | Jual: Rp {p.selling_price.toLocaleString('id-ID')}</div>
                              </div>
                          ))}
                          <div 
                            onClick={() => { setShowDropdown(false); setShowAddProductModal(true); }}
                            className="p-4 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer border-t border-primary/10 transition flex items-center justify-center font-bold text-sm"
                          >
                            + Barang Tidak Ditemukan? Tambah Baru
                          </div>
                        </div>
                      )}
                      
                      <Button variant="outline" type="button" onClick={() => setShowAddProductModal(true)} className="w-full mt-4 border-dashed border-2 text-gray-500 hover:text-primary hover:border-primary transition rounded-2xl h-12">
                        + Tambah Produk Baru ke Master
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between w-full bg-primary/10 border border-primary/20 rounded-2xl p-4">
                        <div>
                          <div className="text-sm font-bold text-primary">{formData.name}</div>
                          <div className="text-xs text-primary mt-1">Stok Gudang: {formData.oldStock}</div>
                        </div>
                        <button type="button" onClick={() => setFormData({ productId: '', name: '', quantity: '', costPrice: '', sellingPrice: '', oldStock: 0 })} className="text-primary hover:text-red-500 font-bold px-3 py-1 bg-white rounded-lg shadow-sm text-xs transition">Ganti</button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Jumlah Beli (Pcs)</label>
                        <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-gray-50 focus:bg-white focus:border-primary rounded-2xl p-3 text-sm font-semibold text-gray-800 focus:outline-none transition border border-transparent" placeholder="0" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Beli (/Pcs)</label>
                        <input required type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full bg-gray-50 focus:bg-white focus:border-primary rounded-2xl p-3 text-sm font-semibold text-green-600 focus:outline-none transition border border-transparent" placeholder="0" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Jual (/Pcs)</label>
                        <input required type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full bg-gray-50 focus:bg-white focus:border-primary rounded-2xl p-3 text-sm font-semibold text-green-600 focus:outline-none transition border border-transparent mb-2" placeholder="0" />
                        
                        <div className="bg-primary/10 p-3 rounded-xl border border-primary/10 flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">Margin:</span>
                          <div className="text-right">
                            <span className="text-xs font-black text-green-600 mr-2">Rp {(Number(formData.sellingPrice) - Number(formData.costPrice)).toLocaleString('id-ID')}</span>
                            <span className="text-[10px] font-bold bg-white text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                              {Number(formData.costPrice) > 0 ? (((Number(formData.sellingPrice) - Number(formData.costPrice)) / Number(formData.costPrice)) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button type="button" onClick={handleAddToCart} className="w-full h-12 rounded-2xl font-bold shadow-md shadow-primary/20 text-sm">
                        + Masukkan ke Nota
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: KERANJANG NOTA */}
              <div className="w-full xl:w-2/3 flex flex-col">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Barang di Nota Ini</h3>
                  
                  <div className="flex-1 overflow-x-auto min-h-[300px]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="text-left py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Barang</th>
                          <th className="text-center py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                          <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Harga Beli</th>
                          <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Subtotal</th>
                          <th className="text-center py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.length === 0 ? (
                          <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-medium">Nota masih kosong. Tambahkan barang dari kolom kiri.</td></tr>
                        ) : (
                          cart.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3">
                                <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                <div className="text-[10px] text-primary font-bold mt-1">Jual Baru: Rp {item.sellingPrice.toLocaleString('id-ID')}</div>
                              </td>
                              <td className="py-3 text-center font-bold text-gray-800 text-sm">{item.quantity}</td>
                              <td className="py-3 text-right text-green-600 font-medium text-sm">Rp {item.costPrice.toLocaleString('id-ID')}</td>
                              <td className="py-3 text-right font-black text-green-600 text-sm">Rp {(item.quantity * item.costPrice).toLocaleString('id-ID')}</td>
                              <td className="py-3 text-center">
                                <button onClick={() => handleRemoveFromCart(idx)} className="text-gray-300 hover:text-red-500 transition font-bold text-lg">×</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 border-t-2 border-gray-100 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Subtotal Nota</p>
                        <p className="text-xl font-bold text-gray-600 mt-1">Rp {cartSubtotal.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Diskon Nota (Rp)</label>
                        <input 
                          type="number" 
                          value={discount} 
                          onChange={e => setDiscount(e.target.value)} 
                          className="w-full bg-red-50 focus:bg-white focus:border-red-500 rounded-2xl p-3 text-sm font-semibold text-red-600 focus:outline-none transition border border-transparent" 
                          placeholder="0" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t-2 border-dashed border-gray-100 pt-4">
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Total Akhir Pembayaran</p>
                        <p className="text-3xl font-black text-green-600 mt-1">Rp {cartGrandTotal.toLocaleString('id-ID')}</p>
                      </div>
                      <Button disabled={loading || cart.length === 0} onClick={handleBulkSubmit} className="w-full md:w-auto h-14 px-8 text-base font-bold rounded-2xl shadow-lg shadow-primary/30">
                        {loading ? 'Memproses...' : 'Simpan Transaksi Belanja'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SCANNER MODAL */}
            {showScanner && (
              <BarcodeScanner 
                onScanSuccess={(code) => {
                  setSearchQuery(code);
                  setShowScanner(false);
                  const prod = products.find(p => p.barcode === code);
                  if (prod) handleProductSelect(prod.id.toString());
                }}
                onClose={() => setShowScanner(false)}
              />
            )}
          </div>
        )}

        {/* MODAL TAMBAH PRODUK BARU */}
        {showAddProductModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white p-8 rounded-[32px] shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowAddProductModal(false)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition"
              >✕</button>
              <h2 className="text-xl font-bold mb-2 text-gray-800">📦 Tambah Produk Baru</h2>
              <p className="text-sm text-gray-500 mb-6">Produk ini akan disimpan ke Master Data.</p>
              
              <form onSubmit={handleAddNewProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Nama Barang</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="Cth: Kopi Kapal Api" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Barcode (Opsional)</label>
                  <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-mono text-gray-800 focus:outline-none transition" placeholder="Ketik barcode..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label>
                    <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none transition appearance-none">
                      <option value="Umum">Umum</option>
                      <option value="Sembako">Sembako</option>
                      <option value="Rokok">Rokok</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Stok Awal</label>
                    <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Modal</label>
                    <input required type="number" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-green-600 focus:outline-none transition" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Jual</label>
                    <input required type="number" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-green-600 focus:outline-none transition" placeholder="0" />
                  </div>
                </div>

                <Button disabled={loading} type="submit" className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/30 mt-4">
                  {loading ? 'Menyimpan...' : 'Simpan Produk Baru'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}