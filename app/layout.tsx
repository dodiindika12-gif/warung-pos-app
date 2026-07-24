import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Sistem Kasir Warung',
  description: 'Aplikasi POS Sederhana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
        {/* Sidebar Navigasi */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-50">
          <div className="p-6 font-bold text-2xl border-b border-gray-800 tracking-wider">
            🏪 KASIR KITA
          </div>
          <nav className="flex-1 p-4 space-y-2 mt-4">
            <Link href="/" className="block p-3 rounded-lg hover:bg-gray-800 transition">
              🛒 Kasir (POS)
            </Link>
            <Link href="/produk" className="block p-3 rounded-lg hover:bg-gray-800 transition">
              📦 Produk & Inventaris
            </Link>
            <Link href="/pembelian" className="block p-3 rounded-lg hover:bg-gray-800 transition">
              🚚 Pembelian
            </Link>
            <Link href="/laporan" className="block p-3 rounded-lg hover:bg-gray-800 transition">
              📊 Laporan Lengkap
            </Link>
          </nav>
        </aside>

        {/* Konten Utama */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}