# Warung POS App (Aplikasi Kasir Warung Pintar)

Aplikasi kasir (Point of Sale) modern yang dirancang khusus untuk mempermudah manajemen penjualan, inventaris, dan analisa keuntungan warung. Dibangun menggunakan Next.js (React), Tailwind CSS, dan Turso (SQLite).

## Changelog & Version History

### [Versi 1.0] - Rilis Perdana (Current Version)
Rilis ini merupakan peluncuran awal aplikasi Kasir dengan sekumpulan fitur esensial yang sudah matang dan sangat ramah pengguna (Mobile-Friendly).

#### ✨ Fitur Baru (Added)
- **Menu Kasir (POS) yang Intuitif**: Tampilan grid dan list untuk produk, pencarian menggunakan teks/barcode scanner, pemfilteran berdasarkan kategori (dengan antarmuka dropdown responsif di mobile), serta pengelolaan keranjang belanja yang cepat.
- **Master Data Produk yang Komprehensif**: Manajemen inventaris penuh (Tambah, Edit, Hapus) dengan dukungan pemindaian Barcode. Menyediakan fitur analitik stok cerdas (DSI - Days Sales Inventory) untuk mendeteksi barang Kritis, Habis, Overstock, atau Baru.
- **Manajemen Kategori Massal**: Pengguna dapat memilih banyak produk sekaligus (Checkbox) dan mengubah kategorinya secara instan melalui Floating Action Bar.
- **Stock Opname & Kartu Stok**: Fitur untuk menyesuaikan fisik barang dengan sistem, serta log mutasi riwayat keluar-masuk stok barang secara terperinci.
- **Riwayat Transaksi & Pembatalan (Refund)**: Perekaman transaksi lengkap beserta rincian produk yang dibeli. Termasuk tombol untuk membatalkan pesanan jika terjadi kesalahan.
- **Laporan & Analytics Keuntungan**: Dashboard analitik lengkap yang menghitung Total Pendapatan, HPP (Harga Pokok Penjualan), Laba Kotor, Pengeluaran/Beban, dan Laba Bersih. Dilengkapi grafik visual pergerakan penjualan dan Margin Laba harian.
- **Daftar Kulakan (Shopping List)**: Fitur rekomendasi belanja otomatis yang menyarankan produk apa saja yang harus di-restock berdasarkan riwayat penjualan dan stok kritis.
- **Cetak Label Harga (Massal & Satuan)**: Fitur ekspor/print label harga barang untuk ditaruh pada rak warung, mendukung format pencetakan cetak massal (A4).
- **Animasi Loading Global**: Seluruh transisi data dan _loading state_ di dalam aplikasi diseragamkan menggunakan animasi Lottie yang interaktif dan nyaman dipandang.
- **Desain 100% Mobile Friendly**: Semua tabel data yang berat diubah menjadi bentuk Kartu (Card Layout) atau dibuat _horizontally scrollable_ di perangkat seluler agar sangat nyaman dioperasikan oleh kasir melalui HP/Tablet.

---

## Cara Menjalankan Aplikasi di Lokal

1. Instalasi dependensi:
```bash
npm install
```

2. Konfigurasi Database (Turso):
Pastikan Anda sudah memiliki kredensial Turso. Buat file `.env` (berkaca pada `.env.example`) dan isi:
```env
TURSO_DATABASE_URL=libsql://[NAMA_DB_ANDA].turso.io
TURSO_AUTH_TOKEN=[TOKEN_ANDA]
```

3. Jalankan server lokal:
```bash
npm run dev
```
Akses di [http://localhost:3000](http://localhost:3000)
