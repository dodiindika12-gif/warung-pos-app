'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { addProduct, updateProduct, deleteProduct, getProductsWithRecommendation } from '../actions';

type Product = { id: number; name: string; barcode: string; category: string; cost_price: number; selling_price: number; stock: number; sold_last_7_days: number };

function ProdukContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialFilter = searchParams.get('filter') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterType, setFilterType] = useState(initialFilter);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getProductsWithRecommendation();
    const formattedData = data.map((row: any) => ({
      id: row.id, name: row.name, barcode: row.barcode || '', category: row.category || 'Umum', 
      cost_price: row.cost_price, selling_price: row.selling_price, stock: row.stock, sold_last_7_days: row.sold_last_7_days
    }));
    setProducts(formattedData);
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      name: formData.name, 
      barcode: formData.barcode,
      category: formData.category,
      cost_price: Number(formData.cost_price), 
      selling_price: Number(formData.selling_price), 
      stock: Number(formData.stock)
    };
    if (editingProductId) {
      await updateProduct(editingProductId, data);
    } else {
      await addProduct(data);
    }
    setFormData({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '' });
    setEditingProductId(null);
    await loadProducts();
    setLoading(false);
    setShowAddForm(false);
  };

  const handleEditClick = (p: Product) => {
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      category: p.category || 'Umum',
      cost_price: p.cost_price.toString(),
      selling_price: p.selling_price.toString(),
      stock: p.stock.toString()
    });
    setEditingProductId(p.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus barang ini?')) {
      await deleteProduct(id);
      await loadProducts();
    }
  };

  const filteredProducts = products.filter(p => {
    let match = true;
    if (searchQuery) {
      match = match && p.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (filterType === 'low_stock') {
      // Sama dengan logika status Kritis / Habis
      const estimasiKebutuhan = p.sold_last_7_days > 0 ? p.sold_last_7_days : 5;
      const bufferStok = estimasiKebutuhan;
      match = match && (p.stock <= bufferStok);
    }
    return match;
  });

  return (
    <div className="flex w-full h-full p-8 overflow-y-auto">
      <div className="flex flex-col w-full max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800">📦 Master Produk</h1>
            <p className="text-gray-500 font-medium mt-1">Kelola inventaris dan pantau stok warung Anda</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => alert('Fitur Stock Opname segera hadir!')} 
              className="bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 font-bold px-6 py-3 rounded-2xl shadow-sm transition flex items-center gap-2"
            >
              📋 Stock Opname
            </button>
            <button 
              onClick={() => {
                setFormData({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '' });
                setEditingProductId(null);
                setShowAddForm(true);
              }} 
              className="bg-[#EA7C2A] hover:bg-[#d66b1f] text-white font-bold px-6 py-3 rounded-2xl shadow-[0_8px_20px_-6px_rgba(234,124,42,0.5)] transition flex items-center gap-2"
            >
              + Tambah Produk
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          
          {/* Modal Form Tambah / Edit Barang */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg bg-white p-8 rounded-[32px] shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold mb-6 text-gray-800 pr-10">{editingProductId ? '✏️ Edit Barang' : '📦 Tambah Barang'}</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Nama Barang</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="Cth: Kopi Kapal Api" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Barcode (Opsional)</label>
                  <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl p-4 text-sm font-mono text-gray-800 focus:outline-none transition" placeholder="Scan barcode..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Modal</label>
                    <input required type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Jual</label>
                    <input required type="number" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Stok Awal</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                </div>

                <button disabled={loading} type="submit" className="w-full bg-[#EA7C2A] hover:bg-[#d66b1f] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(234,124,42,0.5)] transition mt-4">
                  {loading ? 'Menyimpan...' : (editingProductId ? 'Simpan Perubahan' : '+ Simpan Produk')}
                </button>
              </form>
              </div>
            </div>
          )}

          {/* Tabel Data Master */}
          <div className="w-full bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto flex flex-col mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Daftar & Status Restock</h2>
              
              {/* Filter UI */}
              <div className="flex items-center gap-3">
                <input 
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
                />
                {filterType === 'low_stock' && (
                  <button onClick={() => setFilterType('')} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition">
                    Hapus Filter Stok
                  </button>
                )}
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-4 font-bold">Produk</th>
                  <th className="pb-4 font-bold">Harga</th>
                  <th className="pb-4 font-bold">Laba / Pcs</th>
                  <th className="pb-4 text-center font-bold">Stok</th>
                  <th className="pb-4 text-center font-bold">Status</th>
                  <th className="pb-4 text-center font-bold">Saran Kulakan</th>
                  <th className="pb-4 text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">Tidak ada produk ditemukan.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const marginRp = p.selling_price - p.cost_price;
                    const marginPersen = ((marginRp / p.cost_price) * 100).toFixed(1);
                    
                    const terjualMingguIni = p.sold_last_7_days;
                    const estimasiKebutuhan = terjualMingguIni > 0 ? terjualMingguIni : 5; 
                    const bufferStok = estimasiKebutuhan; 
                    const targetStokIdeal = estimasiKebutuhan + bufferStok;
                    
                    let saranRestock = targetStokIdeal - p.stock;
                    if (saranRestock < 0) saranRestock = 0; 

                    let status = '';
                    let statusColor = '';

                    if (p.stock === 0) {
                      status = 'Habis'; statusColor = 'bg-red-50 text-red-500 border border-red-100';
                    } else if (p.stock <= bufferStok) {
                      status = 'Kritis'; statusColor = 'bg-orange-50 text-orange-600 border border-orange-200';
                    } else if (p.stock > (targetStokIdeal * 1.5) && p.stock > 10) {
                      status = 'Overstock'; statusColor = 'bg-blue-50 text-blue-500 border border-blue-100';
                    } else {
                      status = 'Aman'; statusColor = 'bg-green-50 text-green-500 border border-green-100';
                    }

                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-4">
                          <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                          <div className="text-xs text-gray-400 font-medium mt-1">
                            {p.category} {p.barcode && <span className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">📍 {p.barcode}</span>}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-gray-500 font-medium text-xs">
                            <span className="text-gray-400">Beli:</span> Rp {p.cost_price.toLocaleString('id-ID')} <br/>
                            <span className="text-gray-800 font-bold">Jual: Rp {p.selling_price.toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-green-600 font-bold text-sm">Rp {marginRp.toLocaleString('id-ID')}</div>
                          <div className="text-xs text-gray-400 font-medium mt-1">{marginPersen}%</div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="font-black text-gray-800 text-lg">{p.stock}</span>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          {saranRestock > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full text-xs shadow-sm">
                                Beli {saranRestock}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium mt-1.5">Laku {terjualMingguIni}/mgg</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 font-bold text-xs">-</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditClick(p)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Membungkus dengan Suspense karena menggunakan useSearchParams
export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500 font-medium flex items-center justify-center h-full">Memuat Produk...</div>}>
      <ProdukContent />
    </Suspense>
  );
}