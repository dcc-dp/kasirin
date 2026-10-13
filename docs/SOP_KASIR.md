# BUKU PANDUAN STANDAR OPERASIONAL PROSEDUR (SOP) KASIR TOKO
## Sistem Point of Sale (POS) Terpadu - Kasirin

Dokumen ini disusun sebagai panduan resmi operasional kasir harian toko. Seluruh kasir wajib memahami dan menjalankan prosedur di bawah ini guna menjaga kecepatan transaksi, kepuasan pelanggan, serta integritas fisik uang di laci kasir (*Zero Fraud Tolerance*).

---

## DAFTAR ISI
1. [Prosedur Pembukaan Kasir (Open Shift)](#1-prosedur-pembukaan-kasir-open-shift)
2. [Ergonomi Tombol Pintas Keyboard (Hotkeys F1–F8)](#2-ergonomi-tombol-pintas-keyboard-hotkeys-f1f8)
3. [Alur Pelayanan Transaksi Penjualan](#3-alur-pelayanan-transaksi-penjualan)
4. [Penanganan Pelanggan Member & Penukaran Poin](#4-penanganan-pelanggan-member--penukaran-poin)
5. [Diskon Promo & Metode Pembayaran](#5-diskon-promo--metode-pembayaran)
6. [Kas Kecil Darurat (Petty Cash Masuk / Keluar)](#6-kas-kecil-darurat-petty-cash-masuk--keluar)
7. [Prosedur Pembatalan (Void) & Retur Barang](#7-prosedur-pembatalan-void--retur-barang)
8. [Prosedur Tutup Kasir & Cetak Z-Report (End Shift)](#8-prosedur-tutup-kasir--cetak-z-report-end-shift)
9. [Penanganan Masalah Lapangan (Troubleshooting)](#9-penanganan-masalah-lapangan-troubleshooting)

---

## 1. PROSEDUR PEMBUKAAN KASIR (OPEN SHIFT)
Sebelum dapat melayani transaksi apapun, kasir wajib membuka shift kerja di sistem:
1. Nyalakan komputer kasir dan printer thermal struk.
2. Login ke sistem menggunakan akun kasir Anda (`KSR`). Sistem akan langsung mengarahkan Anda ke layar kasir (`/kasir`).
3. Sistem secara otomatis menampilkan pop-up **Buka Shift Kasir**:
   - Hitung fisik uang kembalian (modal awal) yang telah disiapkan di dalam laci kasir (*Cash Drawer*).
   - Masukkan nominal uang modal awal (misal: Rp 200.000). Anda dapat memanfaatkan tombol preset chip cepat (+Rp 50rb, +Rp 100rb, +Rp 200rb).
   - Masukkan catatan shift jika ada (contoh: "Shift Pagi - Kasir Rina").
   - Klik **"Buka Shift Kasir"**.
4. Status shift aktif dan jam operasional kini tampil di bar bagian atas layar kasir.

---

## 2. ERGONOMI TOMBOL PINTAS KEYBOARD (HOTKEYS F1–F8)
Antarmuka Kasirin dirancang **Keyboard-First** agar antrean tidak macet. Minimalkan penggunaan mouse dengan menghafal tombol fungsi berikut:

| Tombol Shortcut | Aksi Sistem | Keterangan Operasional |
|---|---|---|
| `F1` | **Bantuan Shortcut** | Menampilkan panduan cheatsheet tombol pintas di layar |
| `F2` | **Fokus Kolom Cari Barang** | Kursor langsung aktif di kolom pencarian / scan barcode |
| `F3` | **Pilih / Daftar Member** | Membuka pop-up pencarian member & penukaran poin |
| `F4` | **Input Diskon Transaksi** | Membuka modal diskon nota (persentase % atau nominal Rp) |
| `F6` | **Cari Transaksi / Nota Lama**| Mencari riwayat transaksi sebelumnya untuk cetak ulang / retur |
| `Space` / `F8` | **Buka Pembayaran Checkout** | Membuka dialog pembayaran dan kalkulasi kembalian |
| `1` / `2` / `3` | **Pilihan Metode Bayar** | Shortcut saat modal bayar terbuka (`1`: Tunai, `2`: QRIS, `3`: Transfer) |
| `Enter` | **Finalisasi & Cetak Nota** | Menyimpan transaksi dan langsung mencetak struk kasir |
| `Esc` | **Batal / Tutup Pop-up** | Menutup modal pop-up yang sedang aktif |
| `+` / `-` | **Atur Kuantitas Item** | Menambah atau mengurangi jumlah barang di baris keranjang |
| `Delete` | **Hapus Item Keranjang** | Menghapus baris barang yang dipilih dari keranjang |

---

## 3. ALUR PELAYANAN TRANSAKSI PENJUALAN
1. **Pindai Produk**:
   - Arahkan barcode scanner fisik ke barcode kemasan barang.
   - Sistem akan berbunyi *beep scanner* (`1760Hz`) dan otomatis memasukkan produk ke keranjang belanja.
   - Jika kemasan barcode robek atau kotor, tekan `F2` lalu ketikkan sebagian nama barang atau nomor barcode secara manual.
2. **Ubah Kuantitas**:
   - Pindai barang yang sama berulang kali, atau gunakan tombol `+` / `-` pada baris item untuk mempercepat pengisian kuantitas.
3. **Penyelamatan Stok (Negative Stock Prevention)**:
   - Jika stok barang di database habis atau tidak cukup, sistem akan mengeluarkan nada peringatan error dan menolak item tersebut. Segera konfirmasikan ke bagian gudang.

---

## 4. PENANGANAN PELANGGAN MEMBER & PENUKARAN POIN
1. Tanyakan kepada pelanggan: *"Apakah sudah memiliki kartu member?"*.
2. Tekan `F3` untuk membuka modal Member:
   - Ketikkan nomor HP atau nama pelanggan di kolom pencarian.
   - Jika belum terdaftar, kasir dapat mendaftarkan member baru langsung di kasir (*Quick Register*) dengan mengisi nama dan nomor WhatsApp.
   - Jika pelanggan adalah pembeli umum, pilih mode **"Pelanggan Umum (Non-Member)"**.
3. **Penukaran Poin (Redeem Points)**:
   - Setiap transaksi member otomatis mendapatkan 1 poin per kelipatan belanja Rp 10.000.
   - Nilai tukar: **1 Poin = Rp 100 potongan belanja tunai**.
   - Jika member ingin menukar poin, masukkan jumlah poin yang ingin ditukarkan pada kolom penukaran.

---

## 5. DISKON PROMO & METODE PEMBAYARAN NON-TUNAI MIDTRANS
1. **Diskon Promo (`F4`)**:
   - Tekan `F4` jika terdapat voucher diskon khusus atau promo toko. Masukkan persentase diskon (%) atau nominal langsung (Rp).
2. **Buka Modal Bayar (`Space` atau `F8`)**:
   - **Pembayaran Tunai (`1`)**:
     - Masukkan jumlah uang tunai yang diserahkan pelanggan.
     - Kasir dapat menekan tombol chip uang pas atau pecahan umum (Rp 20rb, Rp 50rb, Rp 100rb).
     - Sistem otomatis menghitung kembalian uang pelanggan.
   - **Pembayaran QRIS Dinamis Midtrans (`2`)**:
     - Sistem secara otomatis terhubung ke **Midtrans Core API** dan menampilkan barcode **QRIS Dinamis** dengan nominal belanja riil pelanggan.
     - Pelanggan memindai barcode menggunakan aplikasi e-wallet / mobile banking apapun (GoPay, BCA Mobile, Livin Mandiri, OVO, Dana, ShopeePay, LinkAja).
     - **Auto-Checkout Otomatis**: Sistem melakukan polling real-time setiap 3 detik. Begitu pelanggan selesai membayar di ponselnya, sistem akan berbunyi *success beep*, menyelesaikan faktur otomatis (*auto-settlement*), dan langsung mencetak struk kasir tanpa kasir perlu menekan tombol apapun.
   - **Pembayaran Multi Non-Tunai / Snap (Virtual Account & E-Wallet)**:
     - Jika pelanggan meminta bayar via Virtual Account Bank (BCA, Mandiri, BNI, BRI) atau kartu:
     - Di dalam modal bayar, kasir menekan tombol **"Buka Midtrans Snap Multi Non-Tunai"**.
     - Dialog interaktif Midtrans Snap muncul di layar, kasir/pelanggan memilih metode bank tujuan, nomor VA keluar, dan transaksi diselesaikan secara real-time.
   - **Transfer Bank Langsung (`3`)**:
     - Jika toko menerima transfer bank langsung ke rekening pemilik toko, konfirmasikan mutasi lalu tekan tombol konfirmasi transfer.
3. Tekan `Enter` untuk menyelesaikan transaksi dan mencetak struk thermal nota belanja.

---

## 6. KAS KECIL DARURAT (PETTY CASH MASUK / KELUAR)
Uang di laci kasir tidak boleh keluar atau masuk tanpa pencatatan:
1. Jika toko membutuhkan uang darurat (misal: beli lakban, air mineral, kantong plastik kresek):
   - Klik tombol **"Petty Cash"** di bar atas POS.
   - Pilih tipe **"Kas Keluar (Cash Out)"**.
   - Masukkan nominal uang yang diambil dan alasan keperluan toko.
   - Klik Simpan.
2. Jika pemilik toko menambahkan modal kembalian di tengah hari:
   - Pilih tipe **"Kas Masuk (Cash In)"** beserta nominal dan keterangannya.

---

## 7. PROSEDUR PEMBATALAN (VOID) & RETUR BARANG
Demi mencegah penipuan kasir, seluruh pembatalan transaksi diaudit ketat:
1. **Pembatalan Faktur (Void Transaksi)**:
   - Pembatalan transaksi yang telah dibayar hanya diizinkan dengan otorisasi **Supervisor / Admin Toko**.
   - Kasir membuka modal Void, memilih nomor transaksi, mengisi alasan pembatalan, dan meminta Supervisor menginput kredensial otorisasi.
   - Setelah disetujui, sistem otomatis membatalkan faktur, mengembalikan stok barang ke gudang, dan memotong uang dari buku register.
2. **Retur Barang Pelanggan (`F6`)**:
   - Pelanggan yang membawa nota asli dapat menukarkan barang yang salah beli atau cacat dalam 1x24 jam.
   - Tekan `F6` untuk mencari nomor faktur pelanggan.
   - Pilih barang yang diretur, tentukan kondisinya:
     - **Layak Jual (*Good*)**: Stok dikembalikan ke katalog siap jual.
     - **Rusak (*Damaged*)**: Stok dialihkan ke gudang barang rusak (tidak dijual kembali).
   - Serahkan dana refund kepada pelanggan dan cetak tanda terima retur.

---

## 8. PROSEDUR TUTUP KASIR & CETAK Z-REPORT (END SHIFT)
Di akhir shift atau saat pergantian petugas kasir:
1. Pastikan seluruh transaksi pelanggan yang mengantre telah selesai.
2. Klik tombol **"Tutup Shift"** di pojok kanan atas layar POS.
3. Buka laci kasir dan lakukan **Cash Count** (hitung fisik seluruh uang kertas dan koin di laci).
4. Masukkan hasil hitungan fisik uang ke dalam formulir tutup kasir.
5. Sistem akan membandingkan:
   $$\text{Uang Fisik Aktual} \quad \text{vs} \quad \text{Uang Diharapkan Sistem}$$
6. Jika terjadi selisih (kurang atau lebih), tuliskan keterangan penyebab selisih pada kolom catatan.
7. Klik **"Finalisasi Tutup Shift & Cetak Z-Report"**.
8. Simpan struk thermal Z-Report dan serahkan laci kasir kepada supervisor shift berikutnya.

---

## 9. PENANGANAN MASALAH LAPANGAN (TROUBLESHOOTING)
- **Kertas Struk Thermal Habis / Macet**:
  - Ganti rol kertas thermal baru (pastikan sisi peka panas menghadap ke arah pemanas printer).
  - Tekan `F6`, cari nomor faktur terakhir pelanggan, dan klik tombol **"Cetak Ulang Struk"**.
- **Hardware Barcode Scanner Tidak Merespons**:
  - Pastikan kabel USB scanner terpasang kencang ke port USB komputer.
  - Tekan `F2` dan masukkan kode barcode menggunakan keyboard secara manual.
- **Koneksi Jaringan / Server Terputus**:
  - Item di keranjang kasir aman tersimpan di memori browser (*Cart Recovery*). Refresh halaman setelah koneksi normal dan keranjang belanja akan kembali otomatis.
