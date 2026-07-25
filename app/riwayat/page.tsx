'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTransactionHistory, getTransactionDetails, refundTransaction } from '../actions';

export default function RiwayatPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Format YYYY-MM-DD for input date
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionDetails, setTransactionDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleRowClick = async (trx: any) => {
    setSelectedTransaction(trx);
    setLoadingDetails(true);
    const details = await getTransactionDetails(trx.id);
    setTransactionDetails(details);
    setLoadingDetails(false);
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;
    if (window.confirm('Apakah Anda yakin ingin membatalkan transaksi ini? Stok barang akan dikembalikan.')) {
      setLoading(true);
      await refundTransaction(selectedTransaction.id);
      setSelectedTransaction(null);
      const data = await getTransactionHistory(filterDate || undefined);
      setHistory(data);
      setLoading(false);
      alert('Transaksi berhasil dibatalkan dan stok telah dikembalikan.');
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getTransactionHistory(filterDate || undefined);
      setHistory(data);
      setLoading(false);
    }
    loadData();
  }, [filterDate]);

  return (
    <div className="flex w-full h-full p-8 overflow-y-auto">
      <div className="flex flex-col w-full max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <Link href="/laporan">
              <button className="text-gray-400 hover:text-orange-500 font-bold text-sm mb-4 transition">&larr; Kembali ke Dashboard</button>
            </Link>
            <h1 className="text-3xl font-black text-gray-800">🧾 Riwayat Transaksi</h1>
            <p className="text-gray-500 font-medium mt-1">Daftar seluruh transaksi yang pernah terjadi</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Filter Tanggal</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-orange-500 transition shadow-sm"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-sm transition">
                  Semua
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400 font-medium">Memuat data transaksi...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-4 font-bold">Waktu</th>
                  <th className="pb-4 font-bold">ID Transaksi</th>
                  <th className="pb-4 text-center font-bold">Metode Bayar</th>
                  <th className="pb-4 text-right font-bold">Laba Kotor</th>
                  <th className="pb-4 text-right font-bold">Total Nilai</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Tidak ada transaksi ditemukan pada filter ini.</td>
                  </tr>
                ) : (
                  history.map((h: any) => (
                    <tr key={h.id} onClick={() => handleRowClick(h)} className="border-b border-gray-50 hover:bg-orange-50/50 cursor-pointer transition">
                      <td className="py-4 text-sm font-medium text-gray-500">
                        {new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} <br/>
                        <span className="text-gray-400 text-xs font-bold">{new Date(h.created_at).toLocaleTimeString('id-ID')}</span>
                      </td>
                      <td className="py-4 font-bold text-gray-800 text-sm">Trx #{h.id}</td>
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${h.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {h.payment_method}
                        </span>
                      </td>
                      <td className="py-4 text-right text-green-600 font-bold text-sm">Rp {h.profit.toLocaleString('id-ID')}</td>
                      <td className="py-4 text-right font-black text-orange-600 text-sm">Rp {h.total_amount.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-800 rounded-[32px] w-full max-w-[500px] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Detail Transaksi</h2>
                <p className="text-sm text-gray-500 font-medium">Trx #{selectedTransaction.id}</p>
              </div>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-400 hover:text-gray-600 transition bg-white hover:bg-gray-100 p-2 rounded-full border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between text-sm mb-2 border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Waktu Transaksi:</span>
                <span className="font-bold text-gray-800">{new Date(selectedTransaction.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm mb-4 border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Metode Pembayaran:</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedTransaction.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {selectedTransaction.payment_method}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2">Produk yang Dibeli</h3>
              {loadingDetails ? (
                <div className="text-center py-4 text-gray-400 font-medium text-sm">Memuat detail...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {transactionDetails.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 text-sm mb-1">{item.name}</p>
                        <p className="text-xs text-gray-500 font-bold">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="font-black text-gray-800 text-sm">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-orange-50 p-6 flex flex-col gap-4 border-t border-orange-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold">Total Pembayaran</span>
                <span className="text-orange-500 font-black text-2xl">Rp {selectedTransaction.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <button 
                onClick={handleRefund}
                className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-bold py-4 rounded-[20px] transition border border-red-200"
              >
                Batalkan Transaksi (Refund)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
