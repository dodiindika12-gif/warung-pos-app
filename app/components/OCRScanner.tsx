'use client';

import { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

interface OCRScannerProps {
  products: { id: number; name: string; barcode?: string }[];
  onScanSuccess: (product: any) => void;
  onClose: () => void;
}

export default function OCRScanner({ products, onScanSuccess, onClose }: OCRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Menginisialisasi Kamera...');
  const [ambiguousProducts, setAmbiguousProducts] = useState<any[]>([]);
  const scanInterval = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fungsi untuk membunyikan suara beep pendek menggunakan Web Audio API
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 800; // Nada
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 150);
    } catch (e) {
      console.error("Audio API tidak disupport");
    }
  };

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          setStatus('Siap memindai kemasan...');
          setIsScanning(true);
        }
      } catch (err) {
        if (mounted) {
          console.error("Camera error:", err);
          setStatus('Gagal mengakses kamera. Periksa izin kamera browser Anda.');
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      scanInterval.current = setInterval(captureAndScan, 2000);
    }
    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
    };
  }, [isScanning, products]);

  const stopCamera = () => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.videoWidth === 0) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setStatus('Memproses Teks...');
    try {
      const { data: { text } } = await Tesseract.recognize(
        canvas,
        'ind+eng', // Bahasa Indonesia dan Inggris
        {
          logger: m => {} // Abaikan log progress agar tidak spam
        }
      );

      // Algoritma pencocokan Fuzzy sederhana
      const scannedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const words = scannedText.split(/\s+/).filter(w => w.length > 2); // Hanya kata > 2 huruf

      let topProducts: any[] = [];
      let maxMatches = 0;

      for (const product of products) {
        const productNameWords = product.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        
        let matchCount = 0;
        for (const pWord of productNameWords) {
          if (pWord.length > 2 && words.includes(pWord)) {
            matchCount++;
          }
        }

        // Jika minimal 2 kata cocok, atau 1 kata cocok tapi itu kata yang unik panjang (misal merek)
        if (matchCount >= 2 || (matchCount === 1 && productNameWords.length <= 2)) {
          if (matchCount > maxMatches) {
            maxMatches = matchCount;
            topProducts = [product];
          } else if (matchCount === maxMatches) {
            topProducts.push(product);
          }
        }
      }

      if (topProducts.length === 1) {
        playBeep();
        stopCamera();
        onScanSuccess(topProducts[0]);
      } else if (topProducts.length > 1) {
        playBeep();
        if (scanInterval.current) clearInterval(scanInterval.current);
        setIsScanning(false);
        setAmbiguousProducts(topProducts);
        setStatus('Ditemukan beberapa kemiripan! Silakan pilih.');
      } else {
        setStatus('Tidak ditemukan kecocokan. Tahan kemasan di depan kamera...');
      }
      
    } catch (err) {
      console.error("OCR Error:", err);
      setStatus('Kesalahan memproses gambar.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl relative">
        <div className="p-5 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">🤖 AI Packaging Scanner</h3>
          <button 
            onClick={() => { stopCamera(); onClose(); }} 
            className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-500 transition"
          >
            ✕
          </button>
        </div>
        
        <div className="relative w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
          {ambiguousProducts.length > 0 && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col p-6 overflow-y-auto">
              <h4 className="font-bold text-gray-800 mb-4 text-center">Pilih Produk yang Benar</h4>
              <div className="flex flex-col gap-3">
                {ambiguousProducts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      stopCamera();
                      onScanSuccess(p);
                    }}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-primary/10 hover:border-primary transition"
                  >
                    <div className="font-bold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.category} &bull; Rp {p.selling_price?.toLocaleString('id-ID')}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  setAmbiguousProducts([]);
                  setIsScanning(true);
                  setStatus('Melanjutkan pemindaian...');
                }}
                className="mt-auto p-3 text-center text-red-500 font-bold bg-red-50 rounded-xl w-full"
              >
                Ulangi Scan
              </button>
            </div>
          )}

          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Garis bantu visual */}
          <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none flex items-center justify-center">
            <span className="bg-black/50 text-white/80 px-4 py-2 rounded-full text-xs font-medium">Arahkan kemasan ke sini</span>
          </div>
        </div>
        
        <div className="p-5 text-center bg-gray-50 flex flex-col gap-2">
          <p className="font-medium text-sm text-primary animate-pulse">
            {status}
          </p>
          <p className="text-xs text-gray-400">Pastikan teks pada kemasan terlihat jelas dan mendapat pencahayaan yang cukup.</p>
        </div>
      </div>
    </div>
  );
}
