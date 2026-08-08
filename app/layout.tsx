import './globals.css';
import Link from 'next/link';
import Sidebar from './Sidebar';
import PinWrapper from './PinWrapper';
import { DM_Sans, Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({subsets:['latin'],variable:'--font-heading'});

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'Kios Zaakiyah',
  description: 'Aplikasi POS dengan UI Modern',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("font-sans", dmSans.variable, outfitHeading.variable)}>
      {/* Background luar bergaya gradien/abu-abu lembut ala presentasi desain */}
      <body className="bg-white flex h-[100dvh] font-sans text-gray-800 overflow-hidden">
        
        {/* Kontainer Utama Aplikasi (Melayang & Rounded) */}
        <PinWrapper>
          <div className="flex flex-col-reverse md:flex-row w-full h-full bg-white overflow-hidden relative">
            
            {/* Sidebar Navigasi Dinamis */}
            <Sidebar />

            {/* Konten Utama (Berubah per halaman) */}
            <main className="flex-1 flex overflow-hidden bg-[#FAFAFA]">
              {children}
            </main>

          </div>
        </PinWrapper>
      </body>
    </html>
  );
}