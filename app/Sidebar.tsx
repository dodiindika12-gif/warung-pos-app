'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getSetting, saveSetting } from './actions';

export default function Sidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookToken, setWebhookToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isWebhookOpen) {
      getSetting('webhook_url').then(res => setWebhookUrl(res || ''));
      getSetting('webhook_token').then(res => setWebhookToken(res || ''));
      getSetting('webhook_secret').then(res => setWebhookSecret(res || ''));
    }
  }, [isWebhookOpen]);

  const handleSaveWebhook = async () => {
    await saveSetting('webhook_url', webhookUrl);
    await saveSetting('webhook_token', webhookToken);
    await saveSetting('webhook_secret', webhookSecret);
    setIsWebhookOpen(false);
    alert('Webhook configuration saved!');
  };

  const handleLogout = () => {
    localStorage.removeItem('app_pin_auth');
    window.location.reload();
  };

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
      name: 'Report', 
      href: '/laporan', 
      activePaths: ['/laporan'], 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> 
    },
  ];

  return (
    <>
      <aside className="w-full md:w-24 bg-white border-t md:border-t-0 md:border-r border-gray-100 flex flex-row md:flex-col items-center justify-around md:justify-start py-2 md:py-8 gap-0 md:gap-8 z-40 flex-shrink-0 print:hidden">
        {/* Logo */}
        <div className="hidden md:flex w-12 h-12 bg-white rounded-full items-center justify-center font-black text-xl mb-4 overflow-hidden border border-gray-100 shadow-sm p-1">
          <img src="/logo.png" alt="Logo Kios" className="w-full h-full object-contain" />
        </div>

        {/* Navigasi */}
        <nav className="flex flex-row md:flex-col w-full md:px-4 text-[10px] md:text-xs font-semibold text-gray-400 justify-evenly md:justify-start gap-0 md:gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || item.activePaths.some(p => pathname.startsWith(p));
            
            return (
              <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 group transition ${isActive ? 'text-primary' : 'hover:text-gray-800'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition ${isActive ? 'bg-primary/10 group-hover:bg-primary/20' : 'group-hover:bg-gray-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {item.icon}
                  </svg>
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="hidden md:block flex-1"></div>

        {/* Settings Button & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
            className="hidden md:flex w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl items-center justify-center transition-colors"
            title="Pengaturan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {isSettingsDropdownOpen && (
            <div className="absolute bottom-12 left-0 w-48 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50">
              <button 
                onClick={() => { setIsSettingsOpen(true); setIsSettingsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Docs
              </button>
              <button 
                onClick={() => { setIsWebhookOpen(true); setIsSettingsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2 border-t border-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Webhook
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Pengaturan</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dokumentasi API
                </h3>
                
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-sm text-gray-700 mb-4">
                  <p className="mb-2"><strong>1. API List Tables</strong></p>
                  <p className="mb-2">Gunakan endpoint ini untuk melihat daftar semua tabel yang ada di database Turso Anda.</p>
                  
                  <div className="bg-gray-800 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                    GET /api/tables?pin=2021
                  </div>
                  
                  <p className="font-semibold text-gray-800 mt-3 mb-1">Contoh Penggunaan (Fetch):</p>
                  <pre className="bg-gray-800 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
{`fetch('/api/tables?pin=2021')
  .then(res => res.json())
  .then(data => console.log(data));`}
                  </pre>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-gray-700">
                  <p className="mb-2"><strong>2. API Read Database</strong></p>
                  <p className="mb-2">Gunakan endpoint ini untuk membaca data dari tabel spesifik, atau kosongkan parameter <code>table</code> untuk membaca <strong>seluruh data</strong> dari semua tabel.</p>
                  
                  <div className="bg-gray-800 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                    GET /api/read?pin=2021<br/>
                    GET /api/read?table=[nama_tabel]&pin=2021
                  </div>
                  
                  <p className="font-semibold text-gray-800 mt-3 mb-1">Contoh Penggunaan (Semua Data):</p>
                  <pre className="bg-gray-800 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
{`fetch('/api/read?pin=2021')
  .then(res => res.json())
  .then(data => console.log(data));`}
                  </pre>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    *Gunakan parameter pin=2021 (atau header Authorization: Bearer 2021) untuk otentikasi.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin keluar?')) {
                    localStorage.removeItem('app_pin_auth');
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar (Logout)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {isWebhookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Pengaturan Webhook
              </h2>
              <button 
                onClick={() => setIsWebhookOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Webhook URL</label>
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hook.us1.make.com/..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">API Token (Opsional)</label>
                <input 
                  type="text" 
                  value={webhookToken}
                  onChange={(e) => setWebhookToken(e.target.value)}
                  placeholder="Bearer token jika ada"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Secret (Opsional)</label>
                <input 
                  type="text" 
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Webhook secret signature"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <button 
                onClick={handleSaveWebhook}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
