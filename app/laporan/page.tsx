'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardStats, getChartData } from '../actions';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function LaporanPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Date states, default to today
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  async function loadData() {
    setLoading(true);
    try {
      const statsData = await getDashboardStats(startDate, endDate);
      const chart = await getChartData(startDate, endDate);
      setStats(statsData);
      setChartData(chart);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // Handle Quick Filters
  const setQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  if (!stats && loading) return <div className="p-8 text-gray-500 font-medium flex items-center justify-center h-full">Memuat Dashboard Analytics...</div>;
  if (!stats) return <div className="p-8 text-gray-500">Tidak ada data.</div>;

  const grossProfit = stats.revenue - stats.cogs;
  const netProfit = grossProfit - stats.expense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
          <p className="font-bold text-gray-800 mb-2">{new Date(label).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-medium my-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-500">{entry.name}:</span>
              <span className="text-gray-800 font-bold">Rp {entry.value.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex w-full h-full p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header & Date Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-gray-800">📈 Dashboard Analytics</h1>
            <p className="text-gray-500 font-medium mt-1">Laporan finansial komprehensif</p>
          </div>
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-primary rounded-xl p-3 text-sm font-bold text-gray-700 w-full md:w-auto"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-primary rounded-xl p-3 text-sm font-bold text-gray-700 w-full md:w-auto"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setQuickFilter(0)} className="text-xs font-bold text-gray-500 hover:text-primary transition bg-gray-50 hover:bg-primary/10 px-3 py-1.5 rounded-lg">Hari Ini</button>
              <button onClick={() => setQuickFilter(7)} className="text-xs font-bold text-gray-500 hover:text-primary transition bg-gray-50 hover:bg-primary/10 px-3 py-1.5 rounded-lg">7 Hari</button>
              <button onClick={() => setQuickFilter(30)} className="text-xs font-bold text-gray-500 hover:text-primary transition bg-gray-50 hover:bg-primary/10 px-3 py-1.5 rounded-lg">30 Hari</button>
            </div>
          </div>
        </div>

        {/* Kartu Ringkasan (Top Row) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/10 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Penjualan Kotor</p>
            <p className="text-3xl font-black text-green-600 mt-2 relative z-10">Rp {stats.revenue.toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/10 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Total Transaksi</p>
            <p className="text-3xl font-black text-gray-800 mt-2 relative z-10">{stats.totalTrx} <span className="text-lg font-medium text-gray-400">Trx</span></p>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-50 rounded-full opacity-50 z-0"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide relative z-10">Pengeluaran & HPP</p>
            <p className="text-2xl font-bold text-green-600 mt-2 relative z-10">Rp {(stats.cogs + stats.expense).toLocaleString('id-ID')}</p>
          </div>

          <div className={`p-6 rounded-[32px] shadow-sm border flex flex-col justify-center relative overflow-hidden ${netProfit >= 0 ? 'bg-primary border-primary/20 text-white' : 'bg-red-500 border-red-600 text-white'}`}>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wide relative z-10">Keuntungan Bersih</p>
            <p className="text-3xl font-black mt-2 relative z-10">Rp {netProfit.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* GRAFIK TREN */}
        <div className={`bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Tren Penjualan vs Keuntungan</h2>
          {chartData.length > 0 ? (
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => new Date(tick).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(tick) => `${(tick / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }} />
                  <Area type="monotone" dataKey="revenue" name="Omset (Pendapatan)" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" name="Keuntungan Bersih" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Tidak ada data transaksi di rentang tanggal ini.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Top 10 Terlaris */}
          <div className={`bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 h-fit transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <h2 className="text-xl font-bold mb-6 text-gray-800">🔥 Terlaris (Periode Ini)</h2>
            <div className="space-y-4">
              {stats.bestSellers.length === 0 ? (
                <p className="text-gray-400 font-medium text-sm text-center py-4">Belum ada barang terjual di periode ini.</p>
              ) : (
                stats.bestSellers.map((item: any, idx: number) => (
                  <Link href={`/produk?search=${encodeURIComponent(item.name)}`} key={idx}>
                    <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                          {idx + 1}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                      </div>
                      <div className="bg-gray-100 text-gray-700 font-black px-4 py-2 rounded-xl text-sm">
                        {item.total_sold} Pcs
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Stok Menipis */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">⚠️ Stok Menipis (Saat Ini)</h2>
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

        </div>
      </div>
    </div>
  );
}