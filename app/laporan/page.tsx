'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, getTransactionHistory, getDailySales, getMonthlySales } from '../actions';

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'transaksi' | 'harian' | 'bulanan'>('ringkasan');
  const [dataRingkasan, setDataRingkasan] = useState<any>(null);
  const [dataTrx, setDataTrx] = useState<any[]>([]);
  const [dataHarian, setDataHarian] = useState<any[]>([]);
  const [dataBulanan, setDataBulanan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      const [stats, trx, harian, bulanan] = await Promise.all([
        getDashboardStats(),
        getTransactionHistory(),
        getDailySales(),
        getMonthlySales()
      ]);
      setDataRingkasan(stats); setDataTrx(trx); setDataHarian(harian); setDataBulanan(bulanan);
      setLoading(false);
    }
    fetchAllData();
  }, []);

  if (loading) return <div className="p-8 font-bold">Memuat laporan...</div>;

  const labaKotor = dataRingkasan.revenue - dataRingkasan.cogs;
  const labaBersih = labaKotor - dataRingkasan.expense;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Laporan Lengkap</h1>

      {/* Menu Tabs */}
      <div className="flex gap-4 border-b border-gray-300 mb-8">
        {[
          { id: 'ringkasan', label: 'Ringkasan Hari Ini' },
          { id: 'transaksi', label: 'Riwayat Transaksi' },
          { id: 'harian', label: 'Rekap Harian' },
          { id: 'bulanan', label: 'Rekap Bulanan' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 font-bold transition-colors ${activeTab === tab.id ? 'border-b-4 border-blue-600 text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: RINGKASAN */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500"><p className="text-sm text-gray-500 font-semibold">Omzet Penjualan</p><p className="text-2xl font-bold mt-2">Rp {dataRingkasan.revenue.toLocaleString('id-ID')}</p></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500"><p className="text-sm text-gray-500 font-semibold">Laba Kotor</p><p className="text-2xl font-bold mt-2">Rp {labaKotor.toLocaleString('id-ID')}</p></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500"><p className="text-sm text-gray-500 font-semibold">Pengeluaran Laci</p><p className="text-2xl font-bold mt-2">Rp {dataRingkasan.expense.toLocaleString('id-ID')}</p></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500"><p className="text-sm text-gray-500 font-semibold">Laba Bersih</p><p className={`text-2xl font-bold mt-2 ${labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rp {labaBersih.toLocaleString('id-ID')}</p></div>
          </div>
          <div className="flex gap-6">
            <div className="w-1/2 bg-white p-6 rounded-xl shadow-sm border"><h2 className="font-bold mb-4 border-b pb-2">Rincian Kasir</h2>
              <div className="flex justify-between items-center mb-2"><span className="text-gray-600">Tunai Masuk</span><span className="font-bold">Rp {dataRingkasan.tunai.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between items-center text-red-600 mb-4"><span>Pengeluaran</span><span className="font-bold">- Rp {dataRingkasan.expense.toLocaleString('id-ID')}</span></div>
              <div className="border-t pt-2 flex justify-between items-center font-bold text-blue-700"><span>Estimasi Laci</span><span>Rp {(dataRingkasan.tunai - dataRingkasan.expense).toLocaleString('id-ID')}</span></div>
            </div>
            <div className="w-1/2 bg-white p-6 rounded-xl shadow-sm border"><h2 className="font-bold mb-4 border-b pb-2">Top 5 Terlaris</h2>
              <ul className="space-y-2">{dataRingkasan.bestSellers.map((item:any, i:number) => <li key={i} className="flex justify-between bg-gray-50 p-2 rounded"><span className="font-semibold">{i+1}. {item.name}</span><span className="text-gray-600">{item.total_sold} Terjual</span></li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSAKSI */}
      {activeTab === 'transaksi' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold mb-4 text-xl">Riwayat Transaksi Terbaru</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Waktu</th>
                <th className="p-3">ID Trx</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Total Belanja</th>
                <th className="p-3 text-right">Keuntungan (Laba)</th>
              </tr>
            </thead>
            <tbody>{dataTrx.map((t, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 text-gray-600">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                <td className="p-3 font-mono text-gray-500">#{t.id}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${t.payment_method === 'Tunai' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{t.payment_method}</span></td>
                <td className="p-3 font-bold text-gray-800 text-right">Rp {t.total_amount.toLocaleString('id-ID')}</td>
                <td className="p-3 font-bold text-green-600 text-right">Rp {t.profit.toLocaleString('id-ID')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* TAB 3: HARIAN */}
      {activeTab === 'harian' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold mb-4 text-xl">Rekap Penjualan Per Hari</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Tanggal</th>
                <th className="p-3 text-center">Jumlah Trx</th>
                <th className="p-3 text-right">Total Pendapatan</th>
                <th className="p-3 text-right">Total Laba Kotor</th>
              </tr>
            </thead>
            <tbody>{dataHarian.map((h, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 font-semibold">{h.date}</td>
                <td className="p-3 text-gray-600 text-center">{h.total_trx} Trx</td>
                <td className="p-3 text-right font-bold text-blue-700">Rp {h.total_revenue.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-bold text-green-600">Rp {h.total_profit.toLocaleString('id-ID')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* TAB 4: BULANAN */}
      {activeTab === 'bulanan' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold mb-4 text-xl">Rekap Penjualan Per Bulan</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Bulan</th>
                <th className="p-3 text-center">Jumlah Trx</th>
                <th className="p-3 text-right">Total Pendapatan</th>
                <th className="p-3 text-right">Total Laba Kotor</th>
              </tr>
            </thead>
            <tbody>{dataBulanan.map((b, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 font-semibold">{b.month}</td>
                <td className="p-3 text-gray-600 text-center">{b.total_trx} Trx</td>
                <td className="p-3 text-right font-bold text-blue-700">Rp {b.total_revenue.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-bold text-green-600">Rp {b.total_profit.toLocaleString('id-ID')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

    </div>
  );
}