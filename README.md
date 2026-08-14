# Warung POS App (Aplikasi Kasir Warung Pintar)

Aplikasi kasir (Point of Sale) modern yang dirancang khusus untuk mempermudah manajemen penjualan, inventaris, dan analisa keuntungan warung. Dibangun menggunakan Next.js (React), Tailwind CSS, dan Turso (SQLite).

## Changelog & Version History

### [Versi 1.9] - Laporan Dasar Waktu & Optimasi Loading Foto
- **Feature/Report**: Menambahkan tombol "Laporan Dasar Waktu" di halaman Laporan (Dashboard Analytics). Fitur ini menampilkan *pop-up modal* yang menyajikan data total transaksi dan pendapatan yang dikelompokkan secara dinamis berdasarkan jam kerja dan periode waktu dalam zona waktu WITA (Pagi: 06:00 - 12:00, Siang & Sore: 12:00 - 18:00, Malam: 18:00 - 24:00).
- **Optimization**: Memperbaiki isu pemuatan data aplikasi (loading) yang lambat (memakan waktu hingga 3-5 detik) pada saat pertama kali dimuat. Gambar barang kini di-*fetch* secara *lazy loading* melalui jalur API mandiri (`/api/product-image/[id]`), sehingga query database utama tidak lagi menahan proses render aplikasi karena besarnya payload *Base64 string* dari foto.

### [Versi 1.8] - Format Angka Kalkulator Standar Indonesia
- **Feature/UI**: Mengubah format tampilan angka pada Kalkulator. Layar kini otomatis memberikan pemisah ribuan berupa titik (`.`) dan mengubah lambang desimal menjadi koma (`,`) (misal: `1.000,50`) agar lebih nyaman dan familier di mata pengguna Indonesia, tanpa merusak nilai matematika murni di latar belakang.

### [Versi 1.7] - Pembaruan Kalkulator (Fitur Persen)
- **Feature**: Menambahkan tombol Persentase (%) pada antarmuka Kalkulator. Tombol ini berfungsi membagi angka di layar dengan 100 secara instan, mempermudah kasir dalam menghitung diskon dan margin keuntungan dengan cepat.
- **UI/UX**: Penyesuaian tata letak (grid) pada baris atas *keypad* kalkulator untuk mengakomodasi tombol persen secara rapi.

### [Versi 1.6] - Optimalisasi Barcode Scanner (Beep & Senter)
- **Feature**: Pemindai Barcode kini dilengkapi dengan efek suara (Beep) instan setiap kali berhasil memindai produk, memberikan *feedback* audio layaknya mesin kasir fisik sungguhan.
- **Feature**: Menambahkan tombol "Lampu Senter" pada jendela pemindai Barcode untuk mempermudah kasir memindai barang dalam kondisi minim cahaya (bergantung pada dukungan perangkat HP).
- **Update**: Menyembunyikan sementara fitur percobaan AI Scanner Kemasan (OCR) dari antarmuka utama Kasir dan Master Data untuk difokuskan kembali pada pemindaian barcode yang lebih stabil dan cepat di lapangan.

### [Versi 1.5] - Foto Produk & AI Scanner Kemasan (OCR)
- **Feature**: Mengizinkan penambahan foto pada setiap barang di Master Produk. Foto akan dikompres dan disimpan menggunakan format Base64 secara aman di database.
- **Feature**: AI Scanner Kemasan (Optical Character Recognition) menggunakan Tesseract.js di menu Kasir dan Produk yang memungkinkan kasir menscan teks kemasan barang secara *real-time* via kamera tanpa perlu repot menekan tombol *shutter*.
- **Feature**: Sistem Disambiguasi (Resolusi Konflik) pada AI Scanner jika ditemukan kecocokan untuk 2 produk berbeda yang memiliki kemasan mirip/identik (misal: beda ukuran/gramasi).
- **UI/UX**: Perombakan tata letak Grid list produk di menu Kasir agar memuat foto secara dominan dan indah, serta mengubah desain tombol Keranjang (Cart) melayang di mobile menjadi sebuah *bottom bar* yang elegan dan responsif.

### [Versi 1.4] - Kalkulator & Pembebasan Stok Minus
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
