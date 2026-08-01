'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore frequent frame errors
          }
        );
      } catch (err) {
        if (isMounted) {
          console.error("Camera error:", err);
          setError("Gagal mengakses kamera. Pastikan Anda memberikan izin dan mengakses web ini dari koneksi aman (https/localhost).");
        }
      }
    };

    // Need a tiny timeout to ensure the #reader div is rendered in DOM
    setTimeout(() => {
        if (isMounted) initScanner();
    }, 100);

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl relative">
        <div className="p-5 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">📷 Scan Barcode</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-500 transition">
            ✕
          </button>
        </div>
        
        <div className="relative w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">
              {error}
            </div>
          ) : (
            <div id="reader" className="w-full h-full bg-black"></div>
          )}
        </div>
        
        <div className="p-5 text-center font-medium text-sm text-gray-500 bg-gray-50">
          Arahkan garis barcode produk ke dalam kotak area pemindai
        </div>
      </div>
    </div>
  );
}
