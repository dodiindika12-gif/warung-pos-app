'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function PinWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem('app_pin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2021') {
      setIsAuthenticated(true);
      localStorage.setItem('app_pin_auth', 'true');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-heading mb-2">Akses Terkunci</h2>
        <p className="text-gray-500 mb-6 text-sm">Masukkan PIN untuk mengakses aplikasi.</p>
        
        <form onSubmit={handlePinSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError(false);
            }}
            placeholder="****"
            className={`w-full text-center text-3xl tracking-[0.5em] font-mono py-3 px-4 rounded-xl border-2 transition-all outline-none ${
              error ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
            autoFocus
            maxLength={4}
            inputMode="numeric"
          />
          {error && <p className="text-red-500 text-sm mt-3 text-center">PIN salah, silakan coba lagi.</p>}
          
          <Button type="submit" className="w-full mt-6 h-12 text-lg rounded-xl font-medium shadow-sm transition-transform hover:scale-[1.02] active:scale-95">
            Buka Akses
          </Button>
        </form>
      </div>
    </div>
  );
}
