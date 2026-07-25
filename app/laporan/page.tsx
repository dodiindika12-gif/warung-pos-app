'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardStats, getTransactionHistory, getDailySales, getMonthlySales } from '../actions';

export default function LaporanPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setStats(await getDashboardStats());
      setHistory(await getTransactionHistory());
      setDaily(await getDailySales());
      setMonthly(await getMonthlySales());
    }
    loadData();
  }, []);

  if (!stats) return <div className="p-8 text-gray-500 font-medium flex items-center justify-center h-full">Memuat Dashboard...</div>;

  const grossProfit = stats.revenue - stats.cogs;
  const netProfit = grossProfit - stats.expense;

  return (
    <div className="flex w-full h-full p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-800">📊 Dashboard Penjualan</h1>
          <p className="text-gray-500 font-medium mt-1">Ringkasan performa penjualan dan profitabilitas warung Anda hari ini</p>
        </div>

        {/* Kartu Ringkasan (Top Row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-green-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Penjualan Kotor (Hari Ini)</p>
            <p className="text-3xl font-black text-gray-800 mt-2 relative z-10">Rp {stats.revenue.toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Total Transaksi</p>
            <p className="text-3xl font-black text-gray-800 mt-2 relative z-10">{stats.totalTrx} <span className="text-lg font-medium text-gray-400">Trx</span></p>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Pengeluaran & HPP</p>
            <p className="text-2xl font-bold text-gray-600 mt-2 relative z-10">Rp {(stats.cogs + stats.expense).toLocaleString('id-ID')}</p>
          </div>

          <div className={`p-6 rounded-[32px] shadow-sm border flex flex-col justify-center relative overflow-hidden ${netProfit >= 0 ? 'bg-[#EA7C2A] border-[#d66b1f] text-white' : 'bg-red-500 border-red-600 text-white'}`}>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wide relative z-10">Keuntungan Hari Ini</p>
            <p className="text-3xl font-black mt-2 relative z-10">Rp {netProfit.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Stok Menipis */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">⚠️ Stok Menipis</h2>
            </div>
            <div className="space-y-4">
              {stats.lowStock.length === 0 ? (
                <p className="text-gray-400 font-medium text-sm text-center py-4">Semua stok barang aman.</p>
              ) : (
                stats.lowStock.map((item: any, idx: number) => (
                  <Link href={`/produk?filter=low_stock`} key={idx}>
                    <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-transparent hover:border-red-200 transition cursor-pointer mb-3">
                      <div>
                        <h3 className="font-bold text-red-900 text-sm line-clamp-1">{item.name}</h3>
                        <p className="text-xs font-medium text-red-400 mt-1">{item.barcode || 'Tanpa Barcode'}</p>
                      </div>
                      <div className="bg-red-500 text-white font-black px-4 py-2 rounded-xl text-sm">
                        Sisa {item.stock}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top 10 Terlaris Hari Ini */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🔥 Terlaris Hari Ini</h2>
            <div className="space-y-4">
              {stats.bestSellers.length === 0 ? (
                <p className="text-gray-400 font-medium text-sm text-center py-4">Belum ada barang terjual hari ini.</p>
              ) : (
                stats.bestSellers.map((item: any, idx: number) => (
                  <Link href={`/produk?search=${encodeURIComponent(item.name)}`} key={idx}>
                    <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-transparent hover:border-orange-200 transition cursor-pointer mb-3">
                      <div className="w-10 h-10 rounded-full bg-white text-orange-600 font-black flex items-center justify-center shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                        <p className="text-xs font-medium text-orange-500 mt-1">Terjual: {item.total_sold} Pcs</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Tren Penjualan 7 Hari Terakhir */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">📈 Tren Penjualan (7 Hari)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-4 font-bold">Tanggal</th>
                    <th className="pb-4 text-center font-bold">Trx</th>
                    <th className="pb-4 text-right font-bold">Omzet</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.slice(0, 7).map((d: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-4 text-sm font-bold text-gray-700">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="py-4 text-center"><span className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-lg text-xs">{d.total_trx}</span></td>
                      <td className="py-4 text-right text-gray-800 font-bold text-sm">Rp {d.total_revenue.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  {daily.slice(0, 7).length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400 font-medium">Belum ada data penjualan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 10 Transaksi Terakhir */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">🧾 10 Transaksi Terakhir</h2>
              <Link href="/riwayat">
                <button className="text-sm text-orange-500 font-bold hover:text-orange-600 transition bg-orange-50 px-4 py-2 rounded-xl">Selengkapnya &rarr;</button>
              </Link>
            </div>
            
            <div className="flex-1 space-y-4">
              {history.slice(0, 10).map((h: any) => (
                <div key={h.id} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Trx #{h.id}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(h.created_at).toLocaleTimeString('id-ID')} - {h.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-600">Rp {h.total_amount.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Laba: Rp {h.profit.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-400 font-medium text-sm text-center py-8">Belum ada transaksi.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}