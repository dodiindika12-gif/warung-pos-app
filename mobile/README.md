# Warung POS Mobile App (React Native / Expo)

Aplikasi mobile kasir (Point of Sale) modern yang terintegrasi langsung dengan backend Warung POS.

## Fitur Versi Mobile

1. **Kasir (POS)**:
   - Pencarian barang berdasarkan nama & barcode
   - Filter cepat kategori produk
   - Keranjang belanja interaktif (+/- qty, batas stok, hapus item)
   - Pembayaran fleksibel: Tunai & QRIS / Transfer
   - Kalkulasi kembalian otomatis & tombol pecahan uang pas
   - Struk transaksi digital sukses

2. **Master Produk & Inventaris**:
   - Katalog produk lengkap dengan badge status stok (Aman, Menipis, Habis)
   - Tambah & edit produk baru
   - Hapus produk aman
   - Kelola kategori (tambah, ubah nama, hapus)
   - Stock Opname fisik vs sistem (perhitungan selisih otomatis)
   - Riwayat mutasi stok produk (log keluar/masuk barang)

3. **Kulakan (Pembelian Grosir)**:
   - Buat faktur kulakan multi-item
   - Nama supplier & diskon faktur grosir
   - Update otomatis stok dan harga modal (HPP) serta harga jual baru
   - Riwayat faktur pembelian grosir sebelumnya beserta rincian item

4. **Riwayat Transaksi & Laporan Keuangan**:
   - Filter transaksi harian
   - Rincian produk per transaksi
   - Fitur pembatalan / retur transaksi (mengembalikan stok secara otomatis)
   - KPI Analytics: Total Omzet, Laba Kotor, Pengeluaran Operasional, Laba Bersih
   - Breakdown metode pembayaran: Tunai vs QRIS
   - Catat pengeluaran operasional warung
   - Top 10 produk terlaris & alert stok menipis

5. **Daftar Belanja & Pengaturan API**:
   - Generate otomatis daftar belanja dari rekomendasi penjualan & stok kritis
   - Checklist barang saat berbelanja di pasar/grosir
   - Konfigurasi alamat IP server backend secara dinamis (disimpan ke AsyncStorage)
   - Tes koneksi (Ping) realtime dengan latency ms
   - Preset emulator Android (`10.0.2.2:3000`) & localhost (`127.0.0.1:3000`)

## Cara Menjalankan Mobile App

Pastikan server web Next.js aktif di port 3000:
```bash
npm run dev
```

Jalankan dev server Expo:
```bash
cd mobile
npx expo start
```
- Tekan `a` untuk membuka di Android Emulator
- Tekan `w` untuk membuka di Browser Web
- Scan QR code dengan aplikasi **Expo Go** di HP fisik Anda (pastikan HP dan laptop terhubung ke Wi-Fi yang sama).
