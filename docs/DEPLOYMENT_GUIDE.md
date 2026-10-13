# PANDUAN DEPLOYMENT & OPERASIONAL INFRASTRUKTUR (DEVOPS)
## Kasirin POS & Sistem Keuangan Toko

Panduan ini mendokumentasikan langkah-langkah implementasi, kontainerisasi Docker, deployment produksi, serta strategi pencadangan dan pemulihan bencana (*Disaster Recovery*) untuk sistem Kasirin.

---

## 1. PERSYARATAN MINIMAL SISTEM

### A. Lingkungan Bare Metal / VPS:
- **Sistem Operasi**: Linux (Ubuntu 22.04 LTS / Debian 12 / AlmaLinux 9) atau Windows Server 2022.
- **CPU**: Minimal 2 vCPU (Disarankan 4 vCPU untuk transaksi intensif).
- **RAM**: Minimal 2 GB RAM (Disarankan 4 GB RAM).
- **Disk**: Minimal 20 GB SSD NVMe.
- **Runtime**: Node.js v20 LTS atau Bun v1.2+.
- **Database**: MySQL Server 8.0+ / MariaDB 10.6+.

### B. Lingkungan Kontainer Docker:
- Docker Engine v24.0+
- Docker Compose v2.20+

---

## 2. DEPLOYMENT CEPAT DENGAN DOCKER COMPOSE (REKOMENDASI)

Penggelaran aplikasi beserta database MySQL terisolasi dapat diselesaikan dalam 1 langkah menggunakan file `docker-compose.yml` yang telah disediakan.

### Langkah 1: Klon Repositori & Persiapan Environment
```bash
git clone https://github.com/username/kasirin.git /opt/kasirin
cd /opt/kasirin
cp .env.example .env
```

### Langkah 2: Konfigurasi File `.env`
Buka file `.env` dan perbarui kredensial produksi:
```env
# Database Credentials
MYSQL_ROOT_PASSWORD=K4s1r1n_R00t_S3cur3!
MYSQL_DATABASE=db_kasirin
MYSQL_USER=kasirin
MYSQL_PASSWORD=K4s1r1n_Us3r_P4ss!

# Aplikasi URL & Security Key
DATABASE_URL=mysql://kasirin:K4s1r1n_Us3r_P4ss!@db:3306/db_kasirin
JWT_SECRET=generate_random_base64_string_via_openssl_rand_base64_32
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://kasir.tokoberkah.com
```

### Langkah 3: Build & Jalankan Kontainer
```bash
docker compose up -d --build
```

### Langkah 4: Verifikasi Status Kontainer & Health Check
```bash
docker compose ps
```
Kedua kontainer (`kasirin-mysql-db` dan `kasirin-pos-app`) harus berstatus `healthy` dan aktif melayani di port 3000.

---

## 3. PROBE KESEHATAN SISTEM (SRE HEALTH PROBES)

Sistem menyediakan dua endpoint probe HTTP bawaan:

| Endpoint | Tujuan | Status Normal | Pemanfaatan |
|---|---|---|---|
| `/api/health` | **Liveness Probe** | `HTTP 200 UP` | Memeriksa ketersediaan web server (Uptime, Memory RSS/Heap). Digunakan oleh Docker `HEALTHCHECK` & Kubernetes. |
| `/api/ready` | **Readiness Probe** | `HTTP 200 READY` | Menguji koneksi database MySQL (`SELECT 1`) dan latensi ping. Digunakan oleh Nginx / Load Balancer sebelum meneruskan trafik. |

Contoh pengujian via terminal:
```bash
curl -I http://localhost:3000/api/health
curl -s http://localhost:3000/api/ready | jq .
```

---

## 4. STRATEGI PENCADANGAN DATABASE (AUTOMATED MYSQL DUMP)

Untuk mencegah kehilangan data akibat kerusakan perangkat keras komputer toko, siapkan skrip pencadangan otomatis harian.

### Skrip Backup Harian (`scripts/backup-db.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/kasirin"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="db_kasirin_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR

# Eksekusi dump terkompresi
docker exec kasirin-mysql-db mysqldump -u kasirin -pK4s1r1n_Us3r_P4ss! db_kasirin | gzip > "${BACKUP_DIR}/${FILENAME}"

# Hapus backup yang lebih lama dari 30 hari
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

echo "[$(date)] Backup basis data berhasil disimpan di ${BACKUP_DIR}/${FILENAME}"
```

Tambahkan ke cron job (`crontab -e`) agar berjalan setiap pukul 23:30 malam:
```cron
30 23 * * * /bin/bash /opt/kasirin/scripts/backup-db.sh >> /var/log/kasirin-backup.log 2>&1
```

---

## 5. PROSEDUR PEMULIHAN BENCANA (DISASTER RECOVERY)

Jika terjadi kerusakan server lokal dan perlu memulihkan data dari file dump cadangan:
1. Pastikan kontainer database MySQL telah aktif:
   ```bash
   docker compose up -d db
   ```
2. Pulihkan file backup ke basis data:
   ```bash
   gunzip < /var/backups/kasirin/db_kasirin_20261014.sql.gz | docker exec -i kasirin-mysql-db mysql -u kasirin -pK4s1r1n_Us3r_P4ss! db_kasirin
   ```
3. Restart kontainer aplikasi untuk mengaktifkan koneksi:
   ```bash
   docker compose restart app
   ```
4. Uji endpoint `/api/ready` untuk memastikan seluruh tabel berhasil terbaca.
