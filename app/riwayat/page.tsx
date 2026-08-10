'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTransactionHistory, getTransactionDetails, refundTransaction } from '../actions';
import LoadingAnimation from '../components/LoadingAnimation';

export default function RiwayatPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Format YYYY-MM-DD for input date
  const todayStr = new Date(new Date().getTime() + 8 * 3600 * 1000).toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setCurrentPage(1); // Reset to page 1 on new filter
      setLoading(false);
    }
    loadData();
  }, [filterDate]);

  // Pagination Logic
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHistory = history.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex w-full h-full p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col w-full max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Link href="/laporan">
              <button className="text-gray-400 hover:text-primary font-bold text-sm mb-4 transition">&larr; Kembali ke Dashboard</button>
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
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-primary transition shadow-sm"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-sm transition">
                  Semua
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <LoadingAnimation text="Memuat data transaksi..." />
          ) : (
            <>
              {/* DESKTOP VIEW (TABLE) */}
              <div className="hidden md:block overflow-x-auto">
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
                    {currentHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Tidak ada transaksi ditemukan pada filter ini.</td>
                      </tr>
                    ) : (
                      currentHistory.map((h: any) => (
                        <tr key={h.id} onClick={() => handleRowClick(h)} className="border-b border-gray-50 hover:bg-primary/10/50 cursor-pointer transition">
                          <td className="py-4 text-sm font-medium text-gray-500">
                            {new Date(h.created_at + 'Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} <br/>
                            <span className="text-gray-400 text-xs font-bold">{new Date(h.created_at + 'Z').toLocaleTimeString('id-ID')}</span>
                          </td>
                          <td className="py-4 font-bold text-gray-800 text-sm">Trx #{h.id}</td>
                          <td className="py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${h.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                              {h.payment_method}
                            </span>
                          </td>
                          <td className="py-4 text-right text-green-600 font-bold text-sm">Rp {h.profit.toLocaleString('id-ID')}</td>
                          <td className="py-4 text-right font-black text-green-600 text-sm">Rp {h.total_amount.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW (CARDS) */}
              <div className="flex flex-col gap-4 md:hidden">
                {currentHistory.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 font-medium">Tidak ada transaksi ditemukan.</div>
                ) : (
                  currentHistory.map((h: any) => (
                    <div key={h.id} onClick={() => handleRowClick(h)} className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <span className="font-black text-gray-800 text-lg">Trx #{h.id}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${h.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-600' : 'bg-primary/10 text-primary'}`}>{h.payment_method}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Waktu</span>
                        <span className="font-bold text-gray-700 text-right">{new Date(h.created_at + 'Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} <span className="text-gray-400">{new Date(h.created_at + 'Z').toLocaleTimeString('id-ID')}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Laba Kotor</span>
                        <span className="text-green-600 font-bold">Rp {h.profit.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
                        <span className="text-gray-500 font-bold text-sm">Total Nilai</span>
                        <span className="font-black text-green-600 text-xl">Rp {h.total_amount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          
          {/* Pagination Controls */}
          {!loading && history.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100 gap-4">
              <p className="text-sm text-gray-500 text-center md:text-left">
                Menampilkan <span className="font-bold text-gray-700">{startIndex + 1}</span> - <span className="font-bold text-gray-700">{Math.min(startIndex + itemsPerPage, history.length)}</span> dari <span className="font-bold text-gray-700">{history.length}</span> transaksi
              </p>
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-bold bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex-1 md:flex-none text-center"
                >
                  Sebelumnya
                </button>
                <div className="text-sm font-bold text-gray-800 bg-gray-100 px-4 py-2 rounded-xl whitespace-nowrap">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-bold bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex-1 md:flex-none text-center"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
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
                <span className="font-bold text-green-600">{new Date(selectedTransaction.created_at + 'Z').toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm mb-4 border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Metode Pembayaran:</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedTransaction.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                  {selectedTransaction.payment_method}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2">Produk yang Dibeli</h3>
              {loadingDetails ? (
                <LoadingAnimation text="Memuat detail..." />
              ) : (
                <div className="flex flex-col gap-3">
                  {transactionDetails.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 text-sm mb-1">{item.name}</p>
                        <p className="text-xs text-green-600 font-bold">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="font-black text-green-600 text-sm">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-primary/10 p-6 flex flex-col gap-4 border-t border-primary/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold">Total Pembayaran</span>
                <span className="text-green-600 font-black text-2xl">Rp {selectedTransaction.total_amount.toLocaleString('id-ID')}</span>
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
