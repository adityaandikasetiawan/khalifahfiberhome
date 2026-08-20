# PROGRESS.md — ISP Billing & Payment System

> Dokumen ini adalah sumber kebenaran status proyek. Tujuannya: siapa pun (Aditya, Odi, Ipan, atau Claude di sesi lain) bisa melanjutkan pekerjaan tanpa perlu membaca ulang seluruh riwayat chat. **Update file ini setiap kali menyelesaikan atau memulai sebuah pekerjaan besar.**

Terakhir diperbarui: **22 Juli 2026 (sesi lanjutan #4 — kelengkapan fitur: user management, PDF, IP whitelist, Redis rate limit, test tambahan)**
Status keseluruhan: **Semua functional requirement di PRD (FR-01 s/d FR-16) sudah terimplementasi. 42 test otomatis lulus. Backend production-ready secara arsitektur, tinggal kredensial gateway/WhatsApp asli + uji interaktif browser sebelum go-live.**

---

## 1. Dokumen Acuan

| Dokumen | Lokasi | Isi |
|---|---|---|
| PRD | `PRD_ISP_Billing_System.docx` (dibuat terpisah, di luar folder ini) | Ringkasan eksekutif, scope, requirements FR-01–FR-16, ERD, arsitektur, wireframe |
| Progress (dokumen ini) | `PROGRESS.md` | Status implementasi aktual vs PRD, keputusan teknis, next steps |
| README | `README.md` | Cara menjalankan project (setup, docker, seed, migration, test, mode mock) |
| CI | `.github/workflows/ci.yml` | Pipeline build + unit test + e2e test otomatis di GitHub Actions |

**Jika ada perbedaan antara PRD dan implementasi aktual, dokumen ini (`PROGRESS.md`) yang menang.**

---

## 2. Cross-check terhadap Functional Requirements PRD

Semua FR di PRD (bagian 6) sudah diimplementasikan:

| FR | Deskripsi | Status |
|---|---|---|
| FR-01 – FR-03 | CRUD pelanggan, multi-subscription, billing day & status | ✅ |
| FR-04 – FR-06 | Generate invoice otomatis, item tambahan, riwayat status | ✅ |
| FR-07 – FR-09 | Transaksi pembayaran, webhook idempotent, auto-update status | ✅ |
| FR-10 – FR-11 | Notifikasi WhatsApp, log status kirim | ✅ (logic; belum diuji WA asli) |
| FR-12 – FR-14 | Tugas isolir, update status teknisi, auto-aktivasi | ✅ |
| FR-15 | Dashboard ringkasan | ✅ |
| FR-16 | Export laporan ke Excel/PDF | ✅ **(PDF baru ditambahkan sesi ini — sebelumnya cuma Excel)** |

**Tidak ada FR yang tertinggal.** Fitur di luar FR eksplisit yang ditambahkan karena kebutuhan nyata selama development: portal pelanggan (login OTP), manajemen user admin, mode mock payment, IP whitelist webhook, rate limiting Redis.

---

## 3. Status Implementasi per Modul

Legenda: ✅ Selesai & teruji · 🟡 Selesai, belum teruji end-to-end · ⬜ Belum dikerjakan

### Backend (NestJS) — `backend/src/modules/`

| Modul | Status | Catatan |
|---|---|---|
| `auth` | ✅ | JWT login admin, rate limit 5x/menit (sekarang Redis-backed) |
| `users` | ✅ | **Baru sesi ini**: `POST /users` (buat user baru), `GET /users/manage` (list semua, super_admin only), `PATCH /users/:id/deactivate` |
| `customers` | ✅ | CRUD lengkap + **5 unit test baru** |
| `packages` | ✅ | CRUD + halaman frontend |
| `subscriptions` | ✅ | Create, list, suspend/activate + **4 unit test baru** (fokus ke `findActiveDueToday` yang dipakai cron invoice) |
| `invoices` | ✅ | CRUD manual + cron generator otomatis |
| `payments` | ✅ | Webhook idempotent, create-transaction tersambung ke frontend, mode mock, error handling gateway jelas |
| `notifications` | 🟡 | Logic lengkap, error ditangkap rapi. Belum diuji kirim WA asli |
| `isolir` | ✅ | Task queue + assignment teknisi + **9 unit test baru** (dedup task, validasi role teknisi, suspend vs activate routing) |
| `reports` | ✅ | revenue, overdue, churn + **export Excel DAN PDF** (PDF baru sesi ini, sempat ada bug footer kepotong halaman -- sudah diperbaiki & diverifikasi) |
| `portal-auth` | ✅ | Login OTP WhatsApp |
| `portal` | ✅ | Self-service pelanggan + bayar tagihan sendiri |

### Keamanan (baru sesi ini)

- **IP whitelist webhook** (`WebhookIpWhitelistGuard`) — fail-open kalau `WEBHOOK_ALLOWED_IPS` belum diisi (default aman, tidak mengubah behaviour lama). **Sengaja tidak di-hardcode** ke IP resmi Midtrans/Xendit karena tidak bisa diverifikasi akurat/terkini dari sandbox ini — isi manual saat konfigurasi production dari dokumentasi gateway yang dipakai.
- **Rate limiting sekarang Redis-backed** (`@nest-lab/throttler-storage-redis`), bukan in-memory lagi — limit konsisten walau server di-restart atau di-scale ke banyak instance.
- `app.getHttpAdapter().getInstance().set('trust proxy', 1)` ditambahkan di `main.ts` supaya IP klien akurat di belakang reverse proxy (dibutuhkan IP whitelist guard).

### Testing

| Jenis | File | Jumlah test |
|---|---|---|
| Unit — customers | `customers.service.spec.ts` | 5 (baru) |
| Unit — subscriptions | `subscriptions.service.spec.ts` | 4 (baru) |
| Unit — isolir | `isolir.service.spec.ts` | 9 (baru) |
| Unit — payments (idempotency + error handling + mock) | `payments.service.spec.ts` | 8 |
| Unit — invoices | `invoices.service.spec.ts` | 1 |
| E2E — alur billing penuh | `billing-flow.e2e-spec.ts` | 7 |
| E2E — keamanan portal OTP | `portal-auth.e2e-spec.ts` | 8 |

**Total: 42 test otomatis, semua lulus.**

```bash
npm run test        # unit test (27 test)
npm run test:e2e     # e2e test (15 test, butuh Postgres + Redis + isp_billing_test)
```

### Database & Deployment
Tidak berubah dari sesi sebelumnya.

---

## 4. Verifikasi yang Sudah Dilakukan (bukan cuma "seharusnya jalan")

Tambahan dari sesi ini:

1. **PDF export diuji sungguhan** lewat `file` command (valid PDF) DAN `pdftotext -layout` (memastikan isi & struktur tabel benar, bukan cuma "file-nya kebuka")
2. **Bug PDF ditemukan & diperbaiki dalam sesi yang sama**: footer di posisi y=800 memicu page-break tak disengaja walau tabel kosong (2 halaman untuk laporan kosong) — diperbaiki jadi y=780 + `lineBreak: false`, diverifikasi ulang jadi 1 halaman
3. **User management diuji end-to-end**: buat user teknisi baru (201), coba buat lagi dengan email sama (409 Conflict, validasi duplikat bekerja), list semua user dengan password ter-strip dari response
4. **27 unit test + 15 e2e test dijalankan ulang setelah semua perubahan sesi ini** (IP whitelist guard, Redis throttler, users module baru) — tidak ada regresi
5. Build backend (`nest build`) tetap lolos tanpa error TypeScript setelah menambah 2 package baru (`pdfkit`, `@nest-lab/throttler-storage-redis`)

Belum berubah dari sesi sebelumnya: payment gateway asli, WhatsApp API asli, klik interaktif browser sungguhan.

---

## 5. Keputusan Teknis Penting (jangan diubah tanpa alasan kuat)

Semua keputusan dari sesi-sesi sebelumnya masih berlaku. Tambahan sesi ini:

- **`WebhookIpWhitelistGuard` sengaja fail-open (tidak memblokir apa pun) kalau `WEBHOOK_ALLOWED_IPS` kosong.** Ini disengaja supaya menambahkan guard ini tidak diam-diam mematikan webhook yang sudah berjalan. Keamanan utama tetap di verifikasi signature, bukan di IP whitelist ini.
- **Jangan hardcode IP Midtrans/Xendit ke dalam kode.** IP resmi mereka bisa berubah; isi lewat env var `WEBHOOK_ALLOWED_IPS` saat konfigurasi production, dicek dari dokumentasi resmi gateway yang dipakai saat itu.
- **Endpoint `POST /users` dan `/users/manage` khusus role `super_admin`** — user management adalah operasi sensitif (bisa membuat akun dengan akses penuh), jangan longgarkan role ini.
- **Password di-strip dari SEMUA response `/users/*`** lewat helper `stripPassword()` di controller — kalau menambah endpoint baru di `UsersController`, pastikan tetap pakai helper ini.

---

## 6. Next Steps (urutan yang disarankan)

### Prioritas tinggi (sebelum bisa dipakai tim internal)
- [ ] Buat akun sandbox Midtrans/Xendit sungguhan, isi `.env` (hapus `PAYMENT_PROVIDER=mock`), uji create-transaction & webhook dari dashboard sandbox mereka
- [ ] Buat WhatsApp Business API token (Meta), uji alur OTP & notifikasi dengan pesan WA sungguhan
- [ ] **Klik interaktif di browser sungguhan** (bukan sandbox ini) — sandbox development tidak punya akses browser sama sekali
- [ ] Jalankan `docker compose up` penuh dari nol di mesin lain (Docker tidak tersedia di sandbox ini)
- [ ] Isi `WEBHOOK_ALLOWED_IPS` dengan IP resmi payment gateway yang dipakai (cek dokumentasi terbaru mereka)

### Prioritas menengah
- [ ] Halaman frontend untuk manajemen user (backend sudah siap, tinggal dibuatkan UI di `/users`)
- [ ] Tombol export PDF di halaman `/reports` (backend sudah siap di `revenue/export-pdf` & `overdue/export-pdf`, frontend baru ada tombol Excel)
- [ ] Tampilkan detail transaksi mock (VA number/QR code palsu) di UI mode simulasi untuk demo yang lebih realistis

### Prioritas rendah (hardening production)
- [ ] Test untuk `PackagesService`, `ReportsService`, `NotificationsService`
- [ ] Ganti password admin default sebelum ke production
- [ ] Setup deployment aktual (server, domain, SSL)

---

## 7. Cara Melanjutkan Sesi Berikutnya

1. Upload/tunjukkan `PROGRESS.md` ini terlebih dahulu
2. Sebutkan task mana dari bagian **Next Steps** yang mau dikerjakan
3. Setelah task selesai, **update bagian status modul dan next steps di file ini**

Contoh prompt lanjutan yang baik:
> "Lanjutkan dari PROGRESS.md — tolong buatkan halaman frontend untuk manajemen user, endpoint backend-nya sudah siap."

> "Lanjutkan dari PROGRESS.md — saya sudah dapat sandbox key Midtrans, bantu saya test create-transaction sungguhan."
