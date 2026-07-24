'use client';

import { useState, useEffect } from 'react';
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

  if (!stats) return <div className="p-8 text-gray-500 font-medium flex items-center justify-center h-full">Memuat Laporan...</div>;

  const grossProfit = stats.revenue - stats.cogs;
  const netProfit = grossProfit - stats.expense;

  return (
    <div className="flex w-full h-full p-8 overflow-y-auto">
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-800">📊 Laporan & Analisis</h1>
          <p className="text-gray-500 font-medium mt-1">Ringkasan performa penjualan dan profitabilitas warung Anda hari ini</p>
        </div>

        {/* Kartu Ringkasan (Top Row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-green-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Omzet Hari Ini</p>
            <p className="text-3xl font-black text-gray-800 mt-2 relative z-10">Rp {stats.revenue.toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Modal Terjual (HPP)</p>
            <p className="text-2xl font-bold text-gray-600 mt-2 relative z-10">Rp {stats.cogs.toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Pengeluaran Lainnya</p>
            <p className="text-2xl font-bold text-orange-500 mt-2 relative z-10">Rp {stats.expense.toLocaleString('id-ID')}</p>
          </div>

          <div className={`p-6 rounded-[32px] shadow-sm border flex flex-col justify-center relative overflow-hidden ${netProfit >= 0 ? 'bg-[#EA7C2A] border-[#d66b1f] text-white' : 'bg-red-500 border-red-600 text-white'}`}>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wide relative z-10">Laba Bersih Hari Ini</p>
            <p className="text-3xl font-black mt-2 relative z-10">Rp {netProfit.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="flex gap-8 flex-col xl:flex-row">
          
          {/* Laporan Penjualan Harian */}
          <div className="w-full xl:w-2/3 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Tren Penjualan Harian (30 Hari Terakhir)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-4 font-bold">Tanggal</th>
                    <th className="pb-4 text-center font-bold">Total Trx</th>
                    <th className="pb-4 text-right font-bold">Omzet</th>
                    <th className="pb-4 text-right font-bold">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((d: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-4 text-sm font-bold text-gray-700">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="py-4 text-center"><span className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-lg text-xs">{d.total_trx} Trx</span></td>
                      <td className="py-4 text-right text-gray-800 font-bold text-sm">Rp {d.total_revenue.toLocaleString('id-ID')}</td>
                      <td className="py-4 text-right text-green-600 font-black text-sm">Rp {d.total_profit.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 5 Barang Terlaris */}
          <div className="w-full xl:w-1/3 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🔥 Top 5 Terlaris</h2>
            <div className="space-y-4">
              {stats.bestSellers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-orange-200 transition">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-black flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-xs font-medium text-gray-400 mt-1">Terjual: {item.total_sold} Pcs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}