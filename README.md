# Kasirin — Modern Point of Sale (POS) & Retail Management System

<p align="center">
  <img src="./public/images/logo/logo.svg" alt="Kasirin Logo" width="160" />
</p>

<p align="center">
  <b>Sistem Point of Sale (POS) & Manajemen Retail Modern, Terpadu, Cepat, dan Siap Pakai.</b>
  <br />
  Dirancang dengan pendekatan <i>Keyboard-First</i>, integrasi Payment Gateway <b>Midtrans</b> (QRIS Dinamis & Snap), perlindungan stok <i>ACID (Negative Stock Prevention)</i>, otorisasi supervisor untuk Void/Retur, dan pembukuan kasir berbasis Shift (Z-Report).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-1.0-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Midtrans-Gateway-0070BA?style=for-the-badge" alt="Midtrans Gateway" />
  <img src="https://img.shields.io/badge/Runtime-Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=black" alt="Bun Runtime" />
</p>

---

## 📑 Daftar Isi
1. [Fitur Unggulan](#-fitur-unggulan)
2. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
3. [Prasyarat Sistem](#-prasyarat-sistem)
4. [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
5. [Akun Default Demo](#-akun-default-demo)
6. [Ergonomi Keyboard Kasir (Hotkeys F1–F8)](#-ergonomi-keyboard-kasir-hotkeys-f1f8)
7. [Integrasi Payment Gateway Midtrans](#-integrasi-payment-gateway-midtrans)
8. [Pengujian Unit (Unit Testing)](#-pengujian-unit-unit-testing)
9. [Deployment Menggunakan Docker](#-deployment-menggunakan-docker)
10. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
11. [Dokumentasi Operasional](#-dokumentasi-operasional)
12. [Lisensi](#-lisensi)

---

## ✨ Fitur Unggulan

### 1. ⚡ Layar Kasir POS Berkecepatan Tinggi (Keyboard-First)
- **Operasional Tanpa Mouse**: Seluruh alur transaksi kasir dapat dikendalikan penuh via tombol fungsi keyboard (`F1` - `F8`).
- **Pindai Barcode Cepat**: Dukungan barcode scanner fisik (USB/Bluetooth) dengan respons instan dan pencarian produk otomatis.
- **Efek Suara Audio Sintetis**: Menggunakan *Web Audio API* sintetis tanpa aset file eksternal (bunyi *beep* scanner `1760Hz` dan konfirmasi transaksi sukses).
- **Cart Recovery Otomatis**: Memori keranjang belanja tersimpan aman di browser lokal sehingga kasir tidak kehilangan antrean belanja saat jaringan tidak stabil.

### 2. 💳 Pembayaran Non-Tunai Midtrans Gateway
- **QRIS Dinamis Real-Time (Core API)**: Sistem secara otomatis menghasilkan barcode QRIS dengan nominal belanja riil. Pelanggan dapat memindai dari aplikasi e-wallet/m-banking apapun (GoPay, BCA, Livin Mandiri, OVO, Dana, ShopeePay).
- **Auto-Polling & Auto-Checkout**: Sistem memeriksa status pembayaran setiap 3 detik secara background. Saat pelanggan selesai membayar, sistem otomatis berbunyi *success*, mengunci transaksi, dan mencetak struk kasir.
- **Midtrans Snap Popup**: Dukungan transaksi multi non-tunai lengkap (Virtual Account Bank BCA/Mandiri/BNI/BRI, E-Wallet, dan Kartu).
- **Webhook Asinkron Terverifikasi (`/api/midtrans/webhook`)**: Validasi keamanan ketat menggunakan enkripsi *SHA-512 Signature Hash* untuk mencegah manipulasi transaksi pihak ketiga.
- **Panel Pengaturan Midtrans**: Kelola Server Key, Client Key, toggle mode Sandbox vs Production, serta alat uji koneksi langsung di `/admin/settings`.

### 3. 🛡️ Integritas Transaksi ACID & Pencegahan Stok Minus
- **Negative Stock Prevention**: Mencegah penjualan barang jika stok fisik di database tidak mencukupi (termasuk saat beberapa kasir checkout item yang sama secara serentak).
- **Real-Time Stock Mutation Logs**: Pencatatan audit trail lengkap untuk setiap pergerakan barang (Penjualan, Pembelian/Restock, Void, Retur, dan Penyesuaian Stok/Opname).

### 4. 🔄 Otorisasi Supervisor (Void & Retur Barang)
- **Void Faktur Pembatalan**: Memerlukan otorisasi password Supervisor/Admin. Otomatis memulihkan stok fisik, mencatat mutasi masuk, dan mengoreksi poin member.
- **Retur Barang Pelanggan**: Klasifikasi kondisi barang *Layak Jual (Good)* untuk dikembalikan ke katalog atau *Rusak (Damaged)* untuk dialihkan ke gudang retur, lengkap dengan cetak tanda terima retur.

### 5. 💵 Shift Kasir & Manajemen Laci Uang (Z-Report)
- **Buka Shift (Open Shift)**: Pencatatan modal awal uang tunai laci kasir (*Cash Drawer*) dengan preset chip pecahan cepat.
- **Kas Kecil Darurat (Petty Cash)**: Pencatatan uang masuk (*Cash In*) dan uang keluar (*Cash Out*) disertai alasan operasional.
- **Tutup Shift & Z-Report**: Rekonsiliasi hitungan fisik uang aktual vs kalkulasi sistem, deteksi selisih kas (surplus/defisit), dan pencetakan struk thermal Z-Report penutupan shift.

### 6. 🎁 Program Loyalitas Member & Poin Belanja
- **Pendaftaran Cepat di Kasir**: Input nama dan nomor WhatsApp pelanggan langsung dari pop-up POS.
- **Reward Poin Otomatis**: Pelanggan memperoleh 1 poin setiap kelipatan belanja Rp 10.000.
- **Redeem Poin**: Poin dapat langsung ditukarkan sebagai potongan belanja tunai (1 poin = Rp 100).

### 7. 📊 Laporan Finansial & Analitik Bisnis
- **Ringkasan Finansial**: Omzet Bersih, HPP (COGS), Laba Kotor, Pajak PPN, dan Rata-rata Belanja Keranjang (*Basket Size*).
- **Grafik Tren Interaktif**: Visualisasi penjualan harian, perbandingan metode pembayaran, dan ranking produk terlaris.
- **Performa Kasir**: Evaluasi jumlah transaksi dan kontribusi omzet per kasir.
- **Ekspor Data**: Unduh laporan lengkap dalam format Excel (`.xlsx`), PDF, atau mode Print Layout.

### 8. 🖨️ Desain Struk Thermal Kasir
- Tampilan struk kasir profesional standar 58mm dan 80mm.
- Kustomisasi header toko, alamat, nomor telepon, logo, tarif pajak (PPN), dan catatan kaki struk (*Receipt Footer*).
- Kompatibel dengan printer thermal POS via dialog cetak browser maupun perintah ESC/POS.

---

## 🛠 Teknologi yang Digunakan

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Server-Side Rendering (SSR), Server Actions, Turbopack |
| **UI Library & State** | [React 19](https://react.dev/) | Komponen modern, hooks, dan context API |
| **Styling & Icons** | [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) | Desain antarmuka bersih, responsif, dan Dark Mode native |
| **Database & ORM** | [MySQL 8](https://www.mysql.com/) & [Drizzle ORM](https://orm.drizzle.team/) | Skema type-safe, migrasi deklaratif, dan performa query tinggi |
| **Payment Gateway** | [Midtrans](https://midtrans.com/) (Core API & Snap) | Pembayaran QRIS Dinamis dan Virtual Account Bank |
| **Runtime & Test** | [Bun](https://bun.sh/) | Package manager ultra cepat dan test runner terintegrasi |
| **Autentikasi & RBAC** | [Jose JWT](https://github.com/panva/jose) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Enkripsi sesi berbasis HTTP-only cookies & proteksi brute-force |
| **Laporan & Ekspor** | [SheetJS (xlsx)](https://sheetjs.com/) & [ApexCharts](https://apexcharts.com/) | Pembuatan file spreadsheet Excel & chart visualisasi |

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang:
- **Bun** v1.2+ (Direkomendasikan) atau **Node.js** v20.x+
- **MySQL** v8.0+ atau **MariaDB** v10.5+
- **Git**

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Clone Repository
```bash
git clone https://github.com/dcc-dp/kasirin.git
cd kasirin
```

### 2. Install Dependensi
```bash
bun install
# atau jika menggunakan npm:
# npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file template konfigurasi `.env.example`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan parameter koneksi database Anda:
```env
DATABASE_URL=mysql://root:password@localhost:3306/db_kasirin
JWT_SECRET=rahasia_kunci_jwt_kasirin_super_aman_2026
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opsional: Midtrans Credentials (bisa juga diatur via menu Pengaturan Admin)
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

### 4. Setup Database & Seeding
1. Buat database baru di MySQL (misal via MySQL CLI / phpMyAdmin):
   ```sql
   CREATE DATABASE db_kasirin;
   ```
2. Jalankan pembuatan skema tabel (*push schema*) dan pengisian data awal (*seeding*):
   ```bash
   # Membuat seluruh struktur tabel ke database MySQL
   bun run db:push

   # Mengisi data awal (User Admin, Kasir, Menu, Role Permissions, Sampel Produk & Supplier)
   bun run db:seed
   ```

### 5. Jalankan Server Development
```bash
bun run dev
```
Buka browser dan akses antarmuka POS Kasirin di:
👉 **`http://localhost:3000`**

---

## 👤 Akun Default Demo

Sistem dilengkapi data akun awal bawaan hasil *seeding* untuk pengujian langsung:

| Role | Username | Password | Hak Akses Utama |
|---|---|---|---|
| **Administrator** | `admin` | `password123` | Dashboard, Master Produk, Supplier, Pembelian/Restock, Riwayat Transaksi, Otorisasi Void, Rekap Shift, Laporan Keuangan, Pengaturan Toko & Midtrans Gateway. |
| **Kasir** | `kasir1` | `password123` | Layar Kasir POS (`/kasir`), Buka/Tutup Shift Kasir, Cetak Struk, Redeem Member, Kas Kecil (Petty Cash). |

---

## ⌨️ Ergonomi Keyboard Kasir (Hotkeys F1–F8)

Antarmuka Kasir Kasirin dirancang khusus untuk kecepatan pelayanan antrean kasir:

| Tombol Pintas | Aksi Sistem | Keterangan Operasional |
|---|---|---|
| <kbd>F1</kbd> | **Bantuan Shortcut** | Menampilkan pop-up panduan tombol pintas kasir |
| <kbd>F2</kbd> | **Fokus Scan Barcode / Cari** | Kursor langsung aktif di kolom pencarian produk |
| <kbd>F3</kbd> | **Pilih / Daftar Member** | Modal pencarian member atau pendaftaran member baru |
| <kbd>F4</kbd> | **Diskon Transaksi** | Input diskon nota (persentase `%` atau potongan nominal `Rp`) |
| <kbd>F6</kbd> | **Cari Faktur Lama / Retur** | Pencarian riwayat faktur untuk cetak ulang nota atau proses retur |
| <kbd>Space</kbd> / <kbd>F8</kbd> | **Buka Pembayaran** | Membuka modal pembayaran checkout |
| <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | **Pilihan Metode Bayar** | Shortcut modal bayar (`1`: Tunai, `2`: QRIS Midtrans, `3`: Transfer) |
| <kbd>Enter</kbd> | **Proses Pembayaran** | Finalisasi checkout dan langsung mencetak struk nota |
| <kbd>+</kbd> / <kbd>-</kbd> | **Atur Kuantitas Item** | Menambah atau mengurangi jumlah kuantitas barang belanjaan |
| <kbd>Del</kbd> | **Hapus Item** | Menghapus barang yang dipilih dari keranjang belanja |
| <kbd>Esc</kbd> | **Batal / Tutup** | Menutup modal pop-up yang sedang terbuka |

---

## 💳 Integrasi Payment Gateway Midtrans

Kasirin mendukung pembayaran non-tunai resmi menggunakan **Midtrans Payment Gateway**:

1. **Pengaturan Kredensial di Admin**:
   - Buka menu **Pengaturan Toko** (`/admin/settings`) $\rightarrow$ pilih tab **"Midtrans Gateway"**.
   - Masukkan **Server Key** dan **Client Key** akun Midtrans Anda.
   - Atur switch mode: **Sandbox (Uji Coba)** atau **Production (Langsung)**.
   - Klik **"Uji Koneksi Gateway"** untuk memvalidasi kredensial dan mengukur latensi API.
2. **Pengaturan URL Webhook Notifikasi**:
   - Pada [Midtrans Merchant Dashboard](https://dashboard.midtrans.com) (menu *Settings* $\rightarrow$ *Configuration*), atur **Payment Notification URL** ke:
     ```
     https://domain-anda.com/api/midtrans/webhook
     ```
   - Seluruh notifikasi pembayaran yang masuk akan diverifikasi otomatis menggunakan algoritma hash **SHA-512** (`SHA512(order_id + status_code + gross_amount + ServerKey)`).

---

## 🧪 Pengujian Unit (Unit Testing)

Aplikasi dilengkapi unit test menyeluruh untuk memastikan keandalan formula finansial, pencegahan transaksi minus, keamanan brute-force, dan validasi signature Midtrans:

```bash
bun test
```

**Cakupan Unit Test (18 Tests Passing):**
- `tests/financial.test.ts`: Format Rupiah, pembulatan tunai (*cash rounding*), perhitungan PPN, kembalian, HPP (COGS), dan laba kotor.
- `tests/transaction-integrity.test.ts`: Validasi ACID dan pencegahan stok minus (*Negative Stock Prevention*).
- `tests/rate-limiter.test.ts`: Proteksi rate-limiting login kasir dan penguncian akun otomatis setelah 5 kali salah password.
- `tests/midtrans.test.ts`: Validasi signature SHA-512 webhook Midtrans dan keunikan generator Order ID.

---

## 🐳 Deployment Menggunakan Docker

Proyek ini siap dideploy menggunakan container Docker:

```bash
# Menjalankan aplikasi beserta database MySQL dalam container terisolasi:
docker compose up -d --build
```
Aplikasi akan aktif di `http://localhost:3000` dengan database MySQL yang otomatis terkonfigurasi.

---

## 📂 Struktur Direktori Proyek

```text
kasirin/
├── docs/                      # Dokumentasi & SOP Kasir Toko
│   └── SOP_KASIR.md           # Standar Operasional Prosedur Kasir Harian
├── src/
│   ├── actions/               # Server Actions (Mutasi DB & Business Logic)
│   │   ├── auth.ts            # Login, Logout, Session Token
│   │   ├── member.ts          # CRUD Member & Poin Loyalitas
│   │   ├── midtrans.ts        # Charge QRIS, Status Check, Snap Token
│   │   ├── product.ts         # Master Produk, Kategori, Opname Stok
│   │   ├── purchase.ts        # Restock Pembelian dari Supplier
│   │   ├── report.ts          # Laporan Keuangan, Omzet, Laba Kotor, Ekspor
│   │   ├── setting.ts         # Pengaturan Profil Toko & Midtrans
│   │   ├── shift.ts           # Open/Close Shift Kasir & Petty Cash
│   │   └── transaction.ts     # Checkout Transaksi, Void & Retur
│   ├── app/                   # Next.js App Router (Halaman & Layout)
│   │   ├── (admin)/admin/     # Panel Dashboard Administrator
│   │   ├── (pos)/kasir/       # Layar Operasional Kasir (POS)
│   │   ├── api/midtrans/      # Webhook Handler Midtrans
│   │   └── login/             # Layar Masuk Akun
│   ├── components/            # Komponen UI Reusable
│   │   ├── pos/               # Modal Pembayaran, QRIS Barcode, Lookup Nota
│   │   ├── receipt/           # Layout & Cetak Struk Thermal 58mm/80mm
│   │   └── transaction/       # Modal Detail, Void Supervisor, Retur Barang
│   ├── db/                    # Drizzle ORM Schema, Koneksi MySQL, & Seed
│   │   ├── index.ts           # Connection Pool MySQL
│   │   ├── schema.ts          # Relasi & Skema Database
│   │   └── seed.ts            # Seeder Data Awal
│   └── lib/                   # Library Helper & Core Utilities
│       ├── audio.ts           # Beep Synthesizer (Web Audio API)
│       ├── auth.ts            # JWT Cookie & Password Verification
│       ├── financial.ts       # Format Rupiah, Invoice Generator, Pembulatan
│       ├── midtrans.ts        # Client Engine Midtrans Core API & Snap
│       └── rate-limiter.ts    # Proteksi Anti Brute-Force Login
├── tests/                     # Unit Tests (Bun Test Suite)
├── docker-compose.yml         # Konfigurasi Multi-Container Docker
├── Dockerfile                 # Multi-stage Production Build Dockerfile
└── README.md                  # Dokumentasi Resmi Proyek
```

---

## 📖 Dokumentasi Operasional

Untuk panduan alur kerja harian kasir toko, silakan baca:
- 📘 [Buku Panduan Standar Operasional Prosedur (SOP) Kasir Toko](docs/SOP_KASIR.md)

---

## 📄 Lisensi

Didistribusikan di bawah **Lisensi MIT**. Bebas digunakan dan dikembangkan untuk kebutuhan komersial maupun personal.

<p align="center">
  Dibuat dengan ❤️ untuk kemajuan efisiensi bisnis retail dan UMKM Indonesia.
</p>
