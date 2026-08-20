# ISP Billing & Payment System

Implementasi awal (scaffold produksi) dari PRD "ISP Billing & Payment System" — backend NestJS + frontend Next.js, sesuai arsitektur, ERD, dan wireframe yang telah disusun.

## Struktur Project

```
isp-billing-system/
├── backend/           # NestJS API (modular monolith)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # JWT login, role-based guard
│   │   │   ├── users/           # Admin/internal user (super_admin, finance, cs, technician)
│   │   │   ├── customers/       # CRUD pelanggan
│   │   │   ├── packages/        # Katalog paket internet
│   │   │   ├── subscriptions/   # Relasi pelanggan <-> paket + billing day
│   │   │   ├── invoices/        # Invoice, item, cron generator harian
│   │   │   ├── payments/        # Transaksi pembayaran + webhook idempotent
│   │   │   ├── notifications/   # WhatsApp sender, log, BullMQ processor
│   │   │   ├── isolir/          # Antrian tugas isolir/aktivasi manual (network_tasks)
│   │   │   ├── reports/         # Laporan pendapatan, overdue, churn
│   │   │   ├── portal-auth/     # Login OTP WhatsApp untuk pelanggan
│   │   │   └── portal/          # Endpoint self-service pelanggan (lihat tagihan sendiri)
│   │   ├── common/               # Guards, decorators, filters, interceptors
│   │   └── config/                # Konfigurasi database
│   ├── database/seeds/seed.ts   # Data awal (admin user, paket, pelanggan contoh)
│   ├── test/                     # E2E test (billing flow, portal auth security)
│   └── Dockerfile
├── frontend/           # Next.js 14 App Router (admin dashboard + portal pelanggan)
│   ├── app/
│   │   ├── login/, dashboard/, customers/, packages/, subscriptions/, invoices/, isolir/, reports/
│   │   └── portal/               # Portal pelanggan: login OTP, dashboard, invoice detail
│   └── Dockerfile
└── docker-compose.yml   # Postgres, Redis, backend, frontend
```

## Menjalankan dengan Docker (tercepat)

```bash
cd isp-billing-system/backend
cp .env.example .env
# edit .env: isi JWT_SECRET, kredensial payment gateway, WhatsApp API, dll.

cd ..
docker compose up --build
```

- Backend API: `http://localhost:3000/api/v1`
- Swagger docs: `http://localhost:3000/api/docs`
- Frontend: `http://localhost:3001`

Setelah container backend berjalan, jalankan migration lalu seed data:

```bash
docker compose exec backend npm run migration:run
docker compose exec backend npm run seed
```

Login default setelah seed: `admin@ispbilling.local` / `Admin123!` — **ganti password ini sebelum digunakan di production.**

## Mencoba alur pembayaran TANPA kredensial gateway asli

Belum punya akun sandbox Midtrans/Xendit? Set di `.env`:

```
PAYMENT_PROVIDER=mock
```

Dengan ini, seluruh alur **invoice → bayar → webhook → aktivasi** bisa dicoba penuh:

1. Buka invoice yang belum lunas di `/invoices/[id]` (admin) atau `/portal/invoices/[id]` (pelanggan)
2. Klik "Bayar Sekarang" — transaksi mock dibuat (tidak memanggil Midtrans sama sekali)
3. Di halaman admin, klik "Simulasikan Sukses" atau "Simulasikan Gagal" — ini memicu jalur `handleWebhook` yang **sama persis** dengan webhook produksi, jadi hasilnya representatif
4. Invoice otomatis berubah status, dan kalau subscription sedang suspended, tugas aktivasi otomatis muncul di `/isolir`

**PAYMENT_PROVIDER=mock wajib dihapus/diganti sebelum production** — kode akan menolak permintaan simulasi kalau env var ini tidak persis `"mock"`, tapi tetap jangan pernah set nilai ini di `.env` production untuk menghindari kebingungan.

## Menjalankan secara manual (tanpa Docker)

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # sesuaikan koneksi Postgres/Redis lokal
npm run migration:run
npm run seed
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Prasyarat: PostgreSQL 16 dan Redis berjalan lokal (atau lewat `docker compose up postgres redis`).

## Menjalankan test

```bash
cd backend
npm run test          # unit test (idempotency webhook, invoice generator)

# untuk e2e test, siapkan database terpisah dulu:
createdb isp_billing_test   # atau lewat psql: CREATE DATABASE isp_billing_test;
cp .env.example .env.test
# edit .env.test: DB_NAME=isp_billing_test, isi JWT_SECRET & MIDTRANS_SERVER_KEY (bebas untuk test)
DB_NAME=isp_billing_test npm run migration:run
npm run test:e2e       # alur penuh: login -> invoice -> payment webhook -> aktivasi
```

CI (`.github/workflows/ci.yml`) menjalankan kedua jenis test ini otomatis di setiap push/PR.

## Apa yang sudah diimplementasikan

- Autentikasi JWT + role-based access (`super_admin`, `finance`, `cs`, `technician`), dengan rate limiting Redis-backed.
- CRUD pelanggan, paket, dan subscription (mendukung multi-langganan per pelanggan), lengkap dengan halaman edit di frontend.
- **Manajemen user admin** (`POST /users`, `GET /users/manage`) — buat/nonaktifkan user staff & teknisi, khusus role `super_admin`.
- **Invoice generator otomatis** — cron job harian, sudah diverifikasi berjalan sungguhan (bukan cuma dibaca dari kode).
- **Payment webhook idempotent** — Midtrans (signature verification) & Xendit (callback token), diuji dengan signature asli di e2e test. **Tombol "Bayar Sekarang" di frontend admin & portal sudah tersambung penuh** ke endpoint create-transaction, dengan mode mock untuk testing tanpa kredensial asli.
- **Notifikasi WhatsApp** via BullMQ queue — proses async, tidak memblokir API.
- **Isolir manual berbasis task** (`network_tasks`) dengan **assignment eksplisit ke teknisi** — teknisi menyelesaikan tugas melalui endpoint `/isolir-tasks/:id/complete`.
- **Portal pelanggan dengan login OTP WhatsApp** (`/portal/login`) — pelanggan bisa lihat & bayar tagihan sendiri lewat `/portal/dashboard`, tanpa password, hanya nomor terdaftar + kode OTP. Endpoint anti-enumerasi dan data di-scope ketat per pelanggan.
- Modul laporan: pendapatan bulanan, daftar overdue, ringkasan churn pelanggan, **export ke Excel DAN PDF** (melengkapi FR-16 di PRD).
- **Migration TypeORM** — schema dikelola lewat migration, `synchronize: false` permanen.
- **Rate limiting Redis-backed** (`@nest-lab/throttler-storage-redis`) — konsisten walau server di-restart/di-scale.
- **IP whitelist opsional untuk webhook** (`WEBHOOK_ALLOWED_IPS`) — defense-in-depth di atas signature verification.
- **42 automated test (27 unit + 15 e2e)** mencakup semua service inti: idempotency webhook, cron invoice generator, alur invoice→payment→aktivasi, keamanan OTP portal, isolir task management, subscription lifecycle.
- **CI/CD pipeline** (GitHub Actions) menjalankan build + test otomatis.
- Swagger API docs otomatis di `/api/docs`.
- Frontend admin: login, dashboard billing, CRUD pelanggan & paket, aktivasi subscription, detail invoice + pembayaran + riwayat, tugas isolir dengan assignment teknisi, laporan dengan export Excel.

**Status detail per modul, cross-check terhadap functional requirement PRD, dan next steps ada di [`PROGRESS.md`](./PROGRESS.md) — baca file itu dulu sebelum melanjutkan development.**

## Menjalankan migration

```bash
cd backend
npm run migration:run      # jalankan migration ke database
npm run migration:generate -- database/migrations/NamaPerubahan   # setelah ubah entity
npm run migration:revert   # rollback migration terakhir
```

## Yang masih perlu dilengkapi sebelum production

Daftar lengkap dan prioritasnya ada di `PROGRESS.md` bagian "Next Steps". Ringkasnya:

1. **Kredensial nyata** — isi `MIDTRANS_SERVER_KEY`/`XENDIT_SECRET_KEY` dan `WA_ACCESS_TOKEN` di `.env`, hapus/ganti `PAYMENT_PROVIDER=mock`, lalu uji dengan sandbox account sungguhan.
2. **Uji manual interaktif di browser** — sandbox development tidak punya akses browser sama sekali.
3. **Isi `WEBHOOK_ALLOWED_IPS`** dengan IP resmi payment gateway (cek dokumentasi terbaru mereka saat konfigurasi).
4. **Halaman frontend untuk manajemen user** — backend sudah siap (`/users`), tinggal dibuatkan UI.
5. **Pemisahan proses cron di production** — lihat komentar di `docker-compose.yml` soal PM2 cluster mode.

## Referensi

Dokumen lengkap PRD, ERD, dan arsitektur ada di `PRD_ISP_Billing_System.docx` yang sudah dibuat sebelumnya.
