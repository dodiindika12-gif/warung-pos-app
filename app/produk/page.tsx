'use client';

import { useState, useEffect } from 'react';
import { addProduct, deleteProduct, getProductsWithRecommendation } from '../actions';

type Product = { id: number; name: string; category: string; cost_price: number; selling_price: number; stock: number; sold_last_7_days: number };

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'Umum', cost_price: '', selling_price: '', stock: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getProductsWithRecommendation();
    const formattedData = data.map((row: any) => ({
      id: row.id, name: row.name, category: row.category || 'Umum', 
      cost_price: row.cost_price, selling_price: row.selling_price, stock: row.stock, sold_last_7_days: row.sold_last_7_days
    }));
    setProducts(formattedData);
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addProduct({
      name: formData.name, category: formData.category,
      cost_price: Number(formData.cost_price), selling_price: Number(formData.selling_price), stock: Number(formData.stock)
    });
    setFormData({ name: '', category: 'Umum', cost_price: '', selling_price: '', stock: '' });
    await loadProducts();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus barang ini?')) {
      await deleteProduct(id);
      await loadProducts();
    }
  };

  return (
    <div className="p-8 w-full">
      <h1 className="text-3xl font-bold mb-8">📦 Produk & Inventaris</h1>

      <div className="flex gap-6 flex-col xl:flex-row">
        {/* Form Tambah */}
        <div className="w-full xl:w-1/4 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold mb-4">Tambah Barang</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-600 mb-1">Nama Barang</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Kategori</label><input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Harga Modal</label><input required type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Harga Jual</label><input required type="number" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Stok Awal</label><input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border p-2 rounded" /></div>
            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold mt-2">{loading ? 'Menyimpan...' : '+ Simpan'}</button>
          </form>
        </div>

        {/* Tabel Data Master */}
        <div className="w-full xl:w-3/4 bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Daftar Master Data & Status Restock</h2>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3">Barang</th>
                <th className="p-3">Laba/Pcs</th>
                <th className="p-3 text-center">Stok Fisik</th>
                <th className="p-3 text-center">Status Stok</th>
                <th className="p-3 text-center">Saran Kulakan</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                // Perhitungan Laba
                const marginRp = p.selling_price - p.cost_price;
                const marginPersen = ((marginRp / p.cost_price) * 100).toFixed(1);
                
                // Perhitungan Logika Restock & Buffer 1 Minggu
                const terjualMingguIni = p.sold_last_7_days;
                const estimasiKebutuhan = terjualMingguIni > 0 ? terjualMingguIni : 5; // Minimal set target 5 untuk barang baru
                const bufferStok = estimasiKebutuhan; // Buffer 1 minggu sesuai permintaan
                const targetStokIdeal = estimasiKebutuhan + bufferStok;
                
                let saranRestock = targetStokIdeal - p.stock;
                if (saranRestock < 0) saranRestock = 0; // Tidak perlu beli jika stok lebih dari target

                // Penentuan Status
                let status = '';
                let statusColor = '';

                if (p.stock === 0) {
                  status = 'Habis';
                  statusColor = 'bg-red-100 text-red-700 border border-red-300';
                } else if (p.stock <= bufferStok) {
                  status = 'Kritis'; // Stok sudah masuk area cadangan/buffer
                  statusColor = 'bg-orange-100 text-orange-700 border border-orange-300';
                } else if (p.stock > (targetStokIdeal * 1.5) && p.stock > 10) {
                  status = 'Overstock'; // Stok terlalu banyak, uang mandek
                  statusColor = 'bg-purple-100 text-purple-700 border border-purple-300';
                } else {
                  status = 'Aman';
                  statusColor = 'bg-green-100 text-green-700 border border-green-300';
                }

                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category} | Jual: Rp {p.selling_price.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="p-3 text-blue-600 font-semibold">
                      Rp {marginRp.toLocaleString('id-ID')} <span className="text-xs text-gray-400">({marginPersen}%)</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-gray-700 text-lg">{p.stock}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {saranRestock > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded shadow-sm border border-blue-200">
                            Beli {saranRestock}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1">Terjual {terjualMingguIni}/mgg</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Cukup</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}