'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { 
      name: 'POS', 
      href: '/', 
      activePaths: [], 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /> 
    },
    { 
      name: 'Master', 
      href: '/produk', 
      activePaths: ['/produk'], 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> 
    },
    { 
      name: 'Order', 
      href: '/pembelian', 
      activePaths: ['/pembelian'], 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> 
    },
    { 
      name: 'History', 
      href: '/riwayat', 
      activePaths: ['/riwayat'], 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> 
    },
    { 
      name: 'Report', 
      href: '/laporan', 
      activePaths: ['/laporan'], 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> 
    },
  ];

  return (
    <aside className="w-24 bg-white border-r border-gray-100 flex flex-col items-center py-8 gap-8 z-50 overflow-y-auto">
      {/* Logo */}
      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black text-2xl mb-4">
        C
      </div>

      {/* Navigasi */}
      <nav className="flex flex-col gap-6 w-full px-4 text-xs font-semibold text-gray-400">
        {navItems.map((item) => {
          const isActive = pathname === item.href || item.activePaths.some(p => pathname.startsWith(p));
          
          return (
            <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 group transition ${isActive ? 'text-orange-500' : 'hover:text-gray-800'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${isActive ? 'bg-orange-50 group-hover:bg-orange-100' : 'group-hover:bg-gray-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {item.icon}
                </svg>
              </div>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Profile Placeholder */}
      <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
        <span className="text-xl">👨‍🍳</span>
      </div>
    </aside>
  );
}
