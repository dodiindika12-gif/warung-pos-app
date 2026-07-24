'use client';

import { useState, useEffect } from 'react';
import { getProducts, processCheckout, addExpense } from './actions';

type Product = { id: number; name: string; selling_price: number; stock: number };
type CartItem = Product & { quantity: number };

export default function PosWarung() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS'>('Tunai');
  const [uangDiterima, setUangDiterima] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  // State untuk modal pengeluaran
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getProducts();
    const formattedData = data.map((row: any) => ({
      id: row.id, name: row.name, selling_price: row.selling_price, stock: row.stock
    }));
    setProducts(formattedData);
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const hapusDariKeranjang = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  
  // Hitung kembalian
  const kembalian = typeof uangDiterima === 'number' ? uangDiterima - totalAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong!');
    
    // Validasi uang tunai
    if (paymentMethod === 'Tunai') {
      if (uangDiterima === '' || uangDiterima < totalAmount) {
        return alert('Uang yang diterima kurang dari total belanja!');
      }
    }

    setLoading(true);
    try {
      await processCheckout(cart, paymentMethod, totalAmount);
      alert('Transaksi Berhasil!');
      setCart([]);
      setUangDiterima('');
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert('Gagal memproses transaksi!');
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;
    await addExpense(expenseDesc, Number(expenseAmount));
    alert('Pengeluaran berhasil dicatat!');
    setShowExpenseModal(false);
    setExpenseDesc('');
    setExpenseAmount('');
  };

  return (
    <div className="flex h-full w-full bg-gray-100">
      {/* Modal Pengeluaran Laci */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Catat Pengeluaran Laci</h2>
            <form onSubmit={submitExpense} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Keterangan (Misal: Beli Kresek)</label>
                <input required type="text" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nominal (Rp)</label>
                <input required type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 bg-gray-300 py-2 rounded font-semibold">Batal</button>
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kiri: Daftar Barang */}
      <div className="w-2/3 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🛒 Kasir Warung</h1>
          <button onClick={() => setShowExpenseModal(true)} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-200">
            - Catat Pengeluaran
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <p className="text-blue-600 font-bold">Rp {p.selling_price.toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-500 mt-2">Stok: {p.stock}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanan: Keranjang & Checkout */}
      <div className="w-1/3 bg-white p-6 shadow-lg flex flex-col border-l border-gray-200">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Detail Pesanan</h2>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-600">{item.quantity} x Rp {item.selling_price.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-bold">Rp {(item.quantity * item.selling_price).toLocaleString('id-ID')}</p>
                <button onClick={() => hapusDariKeranjang(item.id)} className="text-xs text-red-500 hover:underline">Hapus</button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-2xl font-bold mb-4 text-blue-700">
            <span>Total:</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className="mb-4 flex gap-2">
            <button className={`flex-1 py-2 rounded font-bold border ${paymentMethod === 'Tunai' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`} onClick={() => setPaymentMethod('Tunai')}>Tunai</button>
            <button className={`flex-1 py-2 rounded font-bold border ${paymentMethod === 'QRIS' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600'}`} onClick={() => setPaymentMethod('QRIS')}>QRIS</button>
          </div>

          {/* Form Uang Diterima & Kembalian (Hanya muncul jika metode Tunai) */}
          {paymentMethod === 'Tunai' && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Uang Diterima (Rp)</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded text-lg font-bold text-gray-800 mb-2" 
                value={uangDiterima} 
                onChange={(e) => setUangDiterima(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-semibold text-gray-600">Kembalian:</span>
                <span className={`text-lg font-bold ${kembalian < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  Rp {kembalian > 0 ? kembalian.toLocaleString('id-ID') : 0}
                </span>
              </div>
            </div>
          )}

          <button onClick={handleCheckout} disabled={loading || cart.length === 0} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
            {loading ? 'Memproses...' : 'BAYAR SEKARANG'}
          </button>
        </div>
      </div>
    </div>
  );
}