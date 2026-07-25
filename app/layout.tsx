import './globals.css';
import Link from 'next/link';
import Sidebar from './Sidebar';

export const metadata = {
  title: 'Sistem Kasir Modern',
  description: 'Aplikasi POS dengan UI Modern',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      {/* Background luar bergaya gradien/abu-abu lembut ala presentasi desain */}
      <body className="bg-[#EBE7E0] flex h-screen p-4 md:p-8 font-sans text-gray-800 overflow-hidden">
        
        {/* Kontainer Utama Aplikasi (Melayang & Rounded) */}
        <div className="flex w-full h-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Sidebar Navigasi Dinamis */}
          <Sidebar />

          {/* Konten Utama (Berubah per halaman) */}
          <main className="flex-1 flex overflow-hidden bg-[#FAFAFA]">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}