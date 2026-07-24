'use client';

import { useState, useEffect } from 'react';
import { getProducts, addPurchase, getRecentPurchases } from '../actions';

type Product = { id: number; name: string; cost_price: number; stock: number };
type Purchase = { id: number; product_name: string; quantity: number; cost_price: number; total_cost: number; created_at: string };

export default function PembelianPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const prods = await getProducts();
    const formattedProds = prods.map((row: any) => ({
      id: row.id, name: row.name, cost_price: row.cost_price, stock: row.stock
    }));
    setProducts(formattedProds);

    const purc = await getRecentPurchases();
    // @ts-ignore
    setPurchases(purc);
  }

  // Auto-fill harga modal jika barang dipilih
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) setCostPrice(prod.cost_price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !costPrice) return alert('Lengkapi semua data!');
    
    setLoading(true);
    try {
      await addPurchase(Number(selectedProductId), Number(quantity), Number(costPrice));
      alert('Berhasil mencatat restock! Stok otomatis bertambah.');
      setSelectedProductId('');
      setQuantity('');
      setCostPrice('');
      await loadData();
    } catch (error) {
      console.error(error);
      alert('Gagal mencatat pembelian');
    } finally {
      setLoading(false);
    }
  };

  const totalCostEstimate = (Number(quantity) || 0) * (Number(costPrice) || 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">🚚 Pembelian & Restock Barang</h1>

      <div className="flex gap-8">
        {/* Form Kulakan */}
        <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold mb-4">Catat Kulakan Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pilih Barang</label>
              <select required value={selectedProductId} onChange={handleProductChange} className="w-full border p-2 rounded bg-white">
                <option value="" disabled>-- Pilih Barang --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm text-gray-600 mb-1">Jml Ditambah (Qty)</label>
                <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-2 rounded" />
              </div>
              <div className="w-1/2">
                <label className="block text-sm text-gray-600 mb-1">Harga Beli/Pcs Baru</label>
                <input required type="number" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-2 rounded" />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded border text-right">
              <span className="text-sm text-gray-500 block">Total Bayar ke Agen:</span>
              <span className="font-bold text-lg text-red-600">Rp {totalCostEstimate.toLocaleString('id-ID')}</span>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold mt-4 transition">
              {loading ? 'Menyimpan...' : 'Simpan Restock'}
            </button>
          </form>
        </div>

        {/* Riwayat Kulakan */}
        <div className="w-2/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Riwayat Kulakan Terakhir</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Barang</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(p.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3 font-semibold">{p.product_name}</td>
                    <td className="p-3 text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        +{p.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-700">
                      Rp {p.total_cost.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">Belum ada riwayat pembelian.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}