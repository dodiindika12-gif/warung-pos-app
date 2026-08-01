'use client';

import { useState, useEffect } from 'react';
import { getProducts, getRecentPurchases, addPurchase } from '../actions';

type Product = { id: number; name: string; stock: number; cost_price: number; barcode: string };
type Purchase = { id: number; product_name: string; quantity: number; cost_price: number; total_cost: number; created_at: string };

export default function PembelianPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [formData, setFormData] = useState({ productId: '', quantity: '', costPrice: '' });

  useEffect(() => {
    loadData();
  }, []);

async function loadData() {
    const prods = await getProducts();
    const purchs = await getRecentPurchases();

    // Trik JSON ini akan mengubah format bawaan database menjadi "plain object" (objek biasa).
    // Ini sekaligus menghilangkan garis merah di VS Code dan error abu-abu di terminal!
    setProducts(JSON.parse(JSON.stringify(prods)));
    setPurchases(JSON.parse(JSON.stringify(purchs)));
  }

  const handleProductSelect = (id: string) => {
    const prod = products.find(p => p.id.toString() === id);
    setFormData({ 
      ...formData, 
      productId: id, 
      costPrice: prod ? prod.cost_price.toString() : '' 
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return alert('Pilih produk dulu!');
    
    setLoading(true);
    await addPurchase(Number(formData.productId), Number(formData.quantity), Number(formData.costPrice));
    
    setFormData({ productId: '', quantity: '', costPrice: '' });
    await loadData();
    alert('Pembelian berhasil dicatat!');
    setLoading(false);
  };

  return (
    <div className="flex w-full h-full p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col w-full max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-800">🚚 Kulakan & Restock</h1>
          <p className="text-gray-500 font-medium mt-1">Catat belanja barang untuk menambah stok dan menghitung HPP</p>
        </div>

        <div className="flex gap-8 flex-col xl:flex-row">
          
          {/* FORM TAMBAH PEMBELIAN */}
          <div className="w-full xl:w-1/3 bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Catat Belanja</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Cari Barang (Nama / Barcode)</label>
                {!formData.productId ? (
                  <>
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} 
                      onKeyDown={handleSearchEnter}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder="Scan barcode atau ketik nama..." 
                      className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition"
                    />
                    {showDropdown && searchQuery && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                        {products
                          .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery)))
                          .map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => handleProductSelect(p.id.toString())}
                              className="p-4 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                            >
                              <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                              <div className="text-xs text-gray-400 mt-1">Barcode: {p.barcode || '-'} | Stok: {p.stock}</div>
                            </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div>
                      <div className="text-sm font-bold text-green-700">{products.find(p => p.id.toString() === formData.productId)?.name}</div>
                      <div className="text-xs text-green-500 mt-1">Stok saat ini: {products.find(p => p.id.toString() === formData.productId)?.stock}</div>
                    </div>
                    <button type="button" onClick={() => { setFormData({...formData, productId: '', costPrice: ''}); setSearchQuery(''); }} className="text-green-500 hover:text-red-500 font-bold px-3 py-1 bg-white rounded-lg shadow-sm text-xs transition">Ganti</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Jumlah Beli (Pcs)</label>
                <input 
                  required type="number" 
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value})} 
                  className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" 
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Beli Baru (/Pcs)</label>
                <input 
                  required type="number" 
                  value={formData.costPrice} 
                  onChange={e => setFormData({...formData, costPrice: e.target.value})} 
                  className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" 
                  placeholder="0"
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">*Harga beli ini akan mengupdate Harga Modal barang di database.</p>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(22,163,74,0.5)] transition mt-4">
                {loading ? 'Menyimpan...' : 'Simpan Transaksi Belanja'}
              </button>
            </form>
          </div>

          {/* TABEL RIWAYAT KULAKAN */}
          <div className="w-full xl:w-2/3 bg-white p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Riwayat Belanja Terakhir</h2>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-4 font-bold">Tanggal</th>
                  <th className="pb-4 font-bold">Barang</th>
                  <th className="pb-4 text-center font-bold">Qty</th>
                  <th className="pb-4 font-bold text-right">Harga Satuan</th>
                  <th className="pb-4 font-bold text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Belum ada riwayat belanja.</td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-4 text-sm font-medium text-gray-500">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 font-bold text-gray-800 text-sm">{p.product_name}</td>
                      <td className="py-4 text-center font-bold text-gray-800 bg-gray-50 rounded-xl my-2 block w-max mx-auto px-4 py-1">{p.quantity}</td>
                      <td className="py-4 text-right text-gray-500 font-medium text-sm">Rp {p.cost_price.toLocaleString('id-ID')}</td>
                      <td className="py-4 text-right font-black text-green-600 text-sm">Rp {p.total_cost.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
}