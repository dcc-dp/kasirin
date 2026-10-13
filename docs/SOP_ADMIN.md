# BUKU PANDUAN STANDAR OPERASIONAL PROSEDUR (SOP) ADMINISTRATOR
## Manajemen Inventaris, Keuangan & Sistem - Kasirin

Dokumen ini disusun sebagai panduan resmi pengelola toko, manajer operasional, dan staf administrasi dalam menjalankan manajemen katalog barang, pembelian restock supplier, analisis laporan keuangan, serta pengawasan keamanan sistem Kasirin.

---

## DAFTAR ISI
1. [Manajemen Katalog Produk & Barcode Rak Toko](#1-manajemen-katalog-produk--barcode-rak-toko)
2. [Prosedur Stock Opname & Audit Mutasi Barang](#2-prosedur-stock-opname--audit-mutasi-barang)
3. [Pengadaan Barang (Restock Supplier) & HPP Otomatis](#3-pengadaan-barang-restock-supplier--hpp-otomatis)
4. [Tata Kelola Data Pelanggan Member & Privasi PII](#4-tata-kelola-data-pelanggan-member--privasi-pii)
5. [Manajemen Vendor Supplier](#5-manajemen-vendor-supplier)
6. [Analisis Laporan Keuangan, Laba Rugi & Ekspor Data](#6-analisis-laporan-keuangan-laba-rugi--ekspor-data)
7. [Pengaturan Profil Toko, Pajak PPN & Struk](#7-pengaturan-profil-toko-pajak-ppn--struk)
8. [Audit Keamanan Sistem, Anti Brute-Force & SRE Health Probes](#8-audit-keamanan-sistem-anti-brute-force--sre-health-probes)

---

## 1. MANAJEMEN KATALOG PRODUK & BARCODE RAK TOKO
Halaman: `/admin/products`

1. **Tambah Produk Baru**:
   - Klik tombol **"Tambah Produk"**.
   - Masukkan Nama Produk, Kategori, dan Satuan.
   - **Barcode**: Pindai barcode asli produk, atau klik **"Generate Barcode EAN-13"** untuk menghasilkan kode unik acak berstandar global.
   - **Harga Modal (HPP)** & **Harga Jual**: Masukkan harga beli dari distributor dan harga jual ke konsumen. Gunakan shortcut persentase margin laba cepat (`+15%`, `+25%`, `+40%`) untuk menentukan harga jual optimal.
2. **Cetak Label Barcode Rak Toko**:
   - Klik ikon Barcode pada baris produk yang diinginkan.
   - Sistem akan merender vektor **SVG Code-128** murni beresolusi tinggi lengkap dengan nama toko, nama produk, harga jual rupiah, dan barcode siap pindai.
   - Pilih ukuran label rak dan klik **"Cetak Label Rak"** via CSS `@media print`.

---

## 2. PROSEDUR STOCK OPNAME & AUDIT MUTASI BARANG
Halaman: `/admin/products` (Tab "Katalog" & "Riwayat Mutasi Stok")

Stock opname berkala wajib dilakukan setiap minggu atau akhir bulan guna memastikan kesesuaian antara stok di rak toko dan database:
1. Klik tombol **"Stock Opname"** pada produk yang akan disesuaikan.
2. Pilih salah satu mode opname:
   - **Input Fisik Riil (*Actual Count*)**: Masukkan jumlah fisik riil yang ditemukan di toko. Sistem otomatis menghitung selisih (kurang/lebih).
   - **Tambah Stok (*Adjustment In*)**: Menambah jumlah unit stok fisik.
   - **Kurang Stok (*Adjustment Out*)**: Mengurangi stok fisik (misal: barang kedaluwarsa, rusak, atau tercecer).
3. Pilih preset alasan audit (misal: "Barang Kedaluwarsa", "Kemasan Rusak", "Selisih Hitungan Fisik", atau "Koreksi Stok Awal").
4. Klik **"Simpan Penyesuaian Stok"**.
5. Seluruh riwayat penyesuaian tersimpan permanen di tab **"Riwayat Mutasi Stok"** (`stock_logs`) beserta nama staf yang melakukan opname, jumlah sebelum/sesudah, dan waktu perubahan.

---

## 3. PENGADAAN BARANG (RESTOCK SUPPLIER) & HPP OTOMATIS
Halaman: `/admin/purchases`

Alur restock barang dari distributor dieksekusi secara atomik ACID untuk mencegah ketidaksinkronan data:
1. Klik tombol **"Faktur Pembelian Baru"**.
2. Pilih nama Supplier distributor dan tanggal kedatangan faktur.
3. Tambahkan baris produk yang dibeli:
   - Pilih nama produk.
   - Masukkan kuantitas unit yang diterima.
   - Masukkan harga beli satuan terbaru dari supplier.
   - Opsi: Jika harga beli naik, centang opsi **"Perbarui Harga Beli Master"** agar sistem memperbarui HPP modal produk.
4. Periksa ringkasan Subtotal dan Grand Total faktur.
5. Klik **"Simpan Faktur Pembelian"**.
6. **Dampak Otomatis Sistem**:
   - Stok fisik produk di tabel `products` bertambah seketika.
   - Tercatat mutasi masuk otomatis di `stock_logs` bertipe `in` dengan referensi nomor faktur pembelian.
   - HPP barang tercatat ke histori keuangan toko.

---

## 4. TATA KELOLA DATA PELANGGAN MEMBER & PRIVASI PII
Halaman: `/admin/members`

1. **Privasi Data Sensitif (PII Compliance)**:
   - Nomor telepon pelanggan dilindungi secara bawaan dengan masking sensor (contoh: `0812-****-7890`) untuk mencegah penyalahgunaan data kontak.
   - Admin dapat mengklik tombol **"Tampilkan / Sensor Nomor HP"** jika memerlukan verifikasi identitas resmi.
2. **Koreksi Poin Loyalty**:
   - Jika terjadi komplain pelanggan terkait bonus poin, admin dapat mengklik tombol **"Atur Poin"** untuk menambah atau mengurangi poin secara manual dengan menyertakan alasan audit.
3. **Pemberitahuan WhatsApp**:
   - Tersedia tombol direct WhatsApp link pada setiap member untuk mengirimkan informasi promo toko secara legal langsung ke ponsel pelanggan.

---

## 5. MANAJEMEN VENDOR SUPPLIER
Halaman: `/admin/suppliers`

1. Kelola data distributor: Nama PT/CV, Nama Kontak Person (PIC), Nomor Telepon/WhatsApp, dan Alamat Gudang Distributor.
2. **Integritas Audit Restock**:
   - Sistem menolak penghapusan supplier yang memiliki riwayat transaksi faktur pembelian demi menjaga keabsahan pembukuan akuntansi toko.

---

## 6. ANALISIS LAPORAN KEUANGAN, LABA RUGI & EKSPOR DATA
Halaman: `/admin/reports`

Modul ini adalah pusat kendali analitik bisnis pemilik toko:
1. **6 Kartu KPI Finansial Terpadu**:
   - **Omzet Bersih**: Total pendapatan setelah dikurangi diskon promo dan pengembalian uang retur.
   - **HPP Modal Terjual (COGS)**: Akumulasi harga modal beli barang yang berhasil terjual.
   - **Laba Kotor & Margin %**: $\text{Omzet Bersih} - \text{HPP}$ beserta persentase margin keuntungan bersih toko.
   - **Beban Pembelian Restock**: Total pengeluaran pengadaan barang ke supplier pada periode tersebut.
   - **Net Selisih Kas Register**: Rekapitulasi selisih uang tunai fisik laci kasir seluruh shift.
   - **Rata-rata Keranjang Belanja (*Basket Size*)**: Rata-rata nominal belanja per struk nota.
2. **Filter Rentang Waktu Fleksibel**:
   - Pilih preset cepat: **Hari Ini**, **Minggu Ini**, **Bulan Ini**, **Tahun Ini**, atau tentukan tanggal manual via **Rentang Kustom**.
3. **Grafik Tren Penjualan & Laba (ApexCharts)**:
   - Visualisasi area chart dinamis time-series harian untuk memantau fluktuasi omzet dan margin profit toko.
4. **Ekspor Data Siap Download**:
   - **Unduh Excel (.xlsx)**: File Microsoft Excel native berisi sheet transaksi lengkap.
   - **Unduh CSV**: File teks CSV berstandar RFC 4180 dengan UTF-8 BOM untuk kompatibilitas spreadsheet.
   - **Cetak Laporan Akuntansi A4**: Format dokumen resmi standar akuntansi lengkap dengan KOP Toko dan kolom tanda tangan pengelola toko.

---

## 7. PENGATURAN PROFIL TOKO, PAJAK PPN & STRUK
Halaman: `/admin/settings`

1. Masukkan Nama Toko, Alamat Fisik, Nomor Telepon/WA, dan Email Toko.
2. Atur **Tarif PPN Default (%)** yang akan berlaku saat transaksi kasir diaktifkan pajaknya.
3. Tuliskan pesan resmi pada **Catatan Kaki Struk Nota** (misal: kebijakan penukaran barang atau ucapan terima kasih).
4. Periksa hasil tampilan pada panel **Live Thermal Receipt Simulator** di sebelah kanan formulir sebelum menekan tombol **"Simpan Perubahan"**.

---

## 8. AUDIT KEAMANAN SISTEM, ANTI BRUTE-FORCE & SRE HEALTH PROBES
Halaman: `/admin/settings` (Tab "Audit Keamanan & SRE")

1. **Pemantauan SRE Health Probes**:
   - Uji kestabilan server web via tombol **"Test Ping"** pada kartu **Liveness Probe (`/api/health`)**.
   - Uji koneksi basis data MySQL via tombol **"Test Ping"** pada kartu **Readiness Probe (`/api/ready`)**. Sistem akan menampilkan latensi ping koneksi secara riil dalam milidetik (*ms*).
2. **Penanganan Akun Terkunci (Anti Brute-Force)**:
   - Jika staf kasir atau admin salah memasukkan password sebanyak 5 kali berturut-turut, sistem akan mengunci akun tersebut selama 15 menit demi mencegah serangan pembobolan kata sandi.
   - Minta staf menunggu masa kunci 15 menit atau hubungi administrator untuk mereset kata sandi melalui database jika mendesak.
