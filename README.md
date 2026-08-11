# Warung POS App (Aplikasi Kasir Warung Pintar)

Aplikasi kasir (Point of Sale) modern yang dirancang khusus untuk mempermudah manajemen penjualan, inventaris, dan analisa keuntungan warung. Dibangun menggunakan Next.js (React), Tailwind CSS, dan Turso (SQLite).

## Changelog & Version History

### [Versi 1.4] - Kalkulator & Pembebasan Stok Minus (Current Version)
- **Feature**: Menambahkan halaman Kalkulator dengan desain modern yang dapat diakses langsung dari menu navigasi.
- **Feature**: Mengizinkan kasir untuk menginput transaksi dan checkout barang meskipun stok sistem 0 atau kurang. Stok akan otomatis menjadi minus (negatif) agar kasir tidak terhambat bekerja saat terjadi selisih stok fisik vs sistem.
- **UI/UX**: Memperbaiki tampilan tombol aksi (Kategori, Opname, Excel, Tambah) pada halaman Master Produk di versi PC agar lebarnya menyesuaikan teks (tidak melebar penuh).
- **UI/UX**: Menyempurnakan layout halaman Kalkulator agar proporsional di tengah layar pada versi PC, serta mengatur jarak presisi 10px antara tombol kalkulator paling bawah dengan menu navigasi pada versi mobile.

### [Versi 1.3] - Hotfix Webhook Trigger
- **Fix**: Memperbaiki isu webhook yang tidak tertrigger saat transaksi selesai. Masalah ini disebabkan oleh pembatalan (kill) Promise otomatis dari Server Actions Next.js saat membaca konfigurasi dari database secara asinkron (dangling promise). Pembacaan konfigurasi webhook kini dilakukan di dalam siklus hidup utama (awaited) sehingga pengiriman webhook lebih stabil dan reliable.

### [Versi 1.2] - Pengaturan UI & Sinkronisasi Zona Waktu
- **Feature**: Memindahkan konfigurasi Webhook URL dari *environment variables* ke antarmuka aplikasi melalui modal Pengaturan Webhook. Data webhook kini disimpan secara persisten di dalam database Turso (tabel `settings`).
- **Feature**: Memperbarui menu "Settings" (Logo Gir) pada *sidebar* menjadi *dropdown* interaktif yang memuat opsi: **Docs**, **Webhook**, dan **Logout**.
- **Feature**: Tombol Logout ditambahkan untuk menghapus sesi otentikasi PIN kasir secara cepat dan langsung mengunci aplikasi.
- **Fix**: Mensinkronkan seluruh pengaturan waktu dan laporan di dalam aplikasi agar secara akurat mencerminkan zona waktu lokal pengguna (WITA / UTC+8). Kueri database dioptimalkan untuk memproses offset waktu sebelum agregasi hari/bulan, dan format tampilan waktu di-update.

### [Versi 1.1] - Hotfix Deployment
- **Fix**: Memperbaiki error saat deployment di Vercel yang disebabkan oleh konflik peer dependency React (ERESOLVE) pada package `@dotlottie/react-player` dengan menambahkan konfigurasi `.npmrc`.

### [Versi 1.0] - Rilis Perdana
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
