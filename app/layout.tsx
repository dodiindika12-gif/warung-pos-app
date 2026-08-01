import './globals.css';
import Link from 'next/link';
import Sidebar from './Sidebar';

export const metadata = {
  title: 'Kios Zaakiyah',
  description: 'Aplikasi POS dengan UI Modern',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      {/* Background luar bergaya gradien/abu-abu lembut ala presentasi desain */}
      <body className="bg-white flex h-[100dvh] font-sans text-gray-800 overflow-hidden">
        
        {/* Kontainer Utama Aplikasi (Melayang & Rounded) */}
        <div className="flex flex-col-reverse md:flex-row w-full h-full bg-white overflow-hidden relative">
          
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