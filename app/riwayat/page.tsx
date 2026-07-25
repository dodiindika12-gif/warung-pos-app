'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTransactionHistory } from '../actions';

export default function RiwayatPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Format YYYY-MM-DD for input date
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);

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
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
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
    </div>
  );
}
