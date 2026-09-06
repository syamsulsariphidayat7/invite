# Rencana Agent — Boundless Invitation: Subdomain Dinamis, Panel Admin & Multi-Layout

## Konteks Proyek
- Stack: SvelteKit
- Status: sudah production tapi masih tahap preview ke konsumen (belum disebar luas)
- URL contoh saat ini: `https://invite.boundless.my.id/ruhaeni-roni` (path-based, data statis)
- Deploy: push ke GitHub → auto-deploy Vercel
- Domain di-manage via Cloudflare (nameserver + DNS records)
- Target akhir: setiap konsumen dapat subdomain sendiri, misal `ruhaeni-roni.boundless.my.id`, tanpa perlu setting DNS/Vercel manual per konsumen
- Panel admin: hanya untuk pemilik projek (1 admin), tidak ada akun/login konsumen

## Prinsip Penting (wajib dipahami agent sebelum eksekusi)
**Subdomain dinamis TIDAK ditangani di Cloudflare atau Vercel per-konsumen.** Kedua layanan itu disetup SEKALI di awal (1 wildcard record), lalu selamanya statis. Yang benar-benar dinamis per konsumen HANYA tabel database `invitations` — setiap konsumen baru = 1 row baru, bukan 1 record DNS baru. Agent tidak perlu dan tidak boleh mencoba membuat/mengubah DNS record atau domain entry per konsumen secara programatik.

---

## FASE 0 — Setup Infrastruktur (MANUAL, di luar akses agent)

1. **Cloudflare DNS**
   - Pastikan domain `boundless.my.id` nameserver-nya memang dikelola Cloudflare
   - Tambah record: `Type: CNAME`, `Name: *`, `Target: cname.vercel-dns.com`, `Proxy status: DNS only` (awan abu-abu, BUKAN oranye)

2. **Vercel Domain Settings**
   - Project Settings → Domains → tambahkan `*.boundless.my.id`
   - Verifikasi SSL wildcard aktif (biasanya otomatis beberapa menit)

3. **Buat akun & project Supabase (atau DB pilihan lain)**
   - Catat `SUPABASE_URL` dan `SUPABASE_ANON_KEY` / `SERVICE_ROLE_KEY`
   - Simpan sebagai environment variable di Vercel project settings

4. **Keputusan bisnis/produk sebelum Fase 1**:
   - Daftar kata reserved untuk subdomain (`www`, `admin`, `api`, `app`, dll), aturan format subdomain yang diizinkan (huruf kecil, angka, strip)
   - Masa aktif invitation (expiry): berapa bulan setelah tanggal acara status otomatis jadi `expired`? Perlu notifikasi ke konsumen sebelum expired?

5. **Backup & monitoring (opsional tapi disarankan sebelum disebar luas)**
   - Cek retention backup otomatis di tier Supabase yang dipakai — kalau tidak cukup, jadwalkan backup manual berkala
   - Pasang error monitoring (misal Sentry, ada free tier) supaya invitation yang crash ketahuan tanpa nunggu komplain konsumen

---

## FASE 1 — Skema Database (AGENT usul → MANUAL approve → AGENT eksekusi)

### 1a. Agent: usulkan skema tabel `invitations`
Kolom minimal:
```
id            uuid, primary key
subdomain     text, unique, not null
nama_pihak_1  text
nama_pihak_2  text
tanggal_acara date
template      text
data_json     jsonb   -- struktur generik, lihat di bawah
status        text    -- draft / active / expired
owner_email   text    -- antisipasi kebutuhan multi-admin/self-service nanti
created_at    timestamp
updated_at    timestamp
```

### 1b. Struktur `data_json` generik (wajib dipakai, bukan opsional)
Dirancang dari hasil analisa layout production yang sudah ada (cover, couple, quote, countdown, event, gallery, love story, digital gift, wishes), dibuat generik supaya kompatibel lintas layout dan lintas jumlah data:
```json
{
  "theme": { "primary": "#8b5e3c", "secondary": "#f5ebe0" },
  "personalize_greeting": true,
  "events": [
    { "name": "Akad", "date": "...", "time": "...", "location": "...", "map_url": "..." },
    { "name": "Resepsi", "date": "...", "time": "...", "location": "...", "map_url": "..." }
  ],
  "gifts": [
    { "type": "bank", "provider": "DANA", "owner": "Ruhaeni", "number": "0857..." },
    { "type": "bank", "provider": "BCA", "owner": "Roni", "number": "..." }
  ],
  "gallery": ["url1", "url2", "..."],
  "love_story": [
    { "title": "Pertemuan", "text": "..." },
    { "title": "Komitmen", "text": "..." }
  ],
  "music_url": "...",
  "livestream_url": "..."
}
```
Poin penting untuk agent:
- `theme` menangani varian warna tanpa perlu layout/komponen baru
- `events` array, bukan field `tanggal_acara`/`lokasi` tunggal — mendukung 1 acara sampai banyak acara (Akad + Resepsi + lainnya) tanpa ubah struktur
- `gifts` array — mendukung berapapun metode/rekening tanpa nambah kolom
- Guest personalization (`?to=Nama` di URL) dibaca terpisah (query param), flag `personalize_greeting` menentukan apakah layout perlu render sapaan personal
- Wishes/RSVP TETAP di tabel terpisah (bukan di `data_json`), karena datanya terus bertambah — beri pagination di layout
- `music_url` & `livestream_url` opsional (null kalau tidak dipakai klien)

### 1c. Manual: review & approve skema (1a + 1b) sebelum dieksekusi ke production DB

### 1d. Agent: eksekusi migration (SQL atau lewat Supabase CLI/ORM yang dipakai)

---

## FASE 2 — Migrasi Data Statis Existing (AGENT)
- Ambil data `ruhaeni-roni` dari kode/file statis yang ada sekarang
- Petakan ke struktur `data_json` Fase 1b (events, gifts, gallery, love_story, dst)
- Insert sebagai row pertama ke tabel `invitations` (subdomain: `ruhaeni-roni`)

---

## FASE 3 — Routing Subdomain Dinamis (AGENT)
- Buat/edit `src/hooks.server.js`:
  - Ambil `event.url.hostname`, parse subdomain (bagian sebelum domain utama)
  - Validasi bukan bagian dari daftar reserved (Fase 0 poin 4)
  - Query tabel `invitations` berdasarkan `subdomain`
  - Simpan hasil ke `event.locals.invitation`
- Update route yang relevan (`+page.server.js`) untuk membaca dari `locals.invitation`, bukan file statis
- Handle case subdomain tidak ditemukan (404 / halaman "undangan tidak ditemukan")

---

## FASE 4 — Testing End-to-End (AGENT)
- Deploy ke Vercel, akses `ruhaeni-roni.boundless.my.id`, pastikan render sama dengan versi lama
- Test subdomain acak (`test123.boundless.my.id`) untuk pastikan 404 handling benar
- Test invitation dengan variasi data (1 event vs banyak event, 1 gift vs banyak gift) untuk pastikan layout tidak crash saat array kosong/panjang
- **Sebelum disebar luas ke publik**: tambahkan rate limiting/captcha sederhana di form wishes/RSVP (public-facing) untuk cegah spam bot, karena saat ini masih tahap preview jadi belum kena risiko ini

---

## FASE 5 — Panel Admin (AGENT, setelah Fase 1–4 stabil)
- CRUD sederhana ke tabel `invitations`: create, edit, ubah status
- Form input mengikuti struktur `data_json` Fase 1b (tambah/hapus event, tambah/hapus gift secara dinamis, bukan field tetap)
- Validasi subdomain unik (cek DB) + format + cek terhadap daftar reserved sebelum insert
- Tampilkan preview link (`{subdomain}.boundless.my.id`) setelah subdomain diisi
- Autentikasi: single admin login, tidak ada akun/registrasi konsumen
- Upload foto galeri: kompresi/resize otomatis sebelum simpan ke storage (Supabase Storage/Vercel Blob), biar tidak boros kuota storage saat konsumen upload foto resolusi asli
- Fitur export data wishes/RSVP ke Excel/PDF — kebutuhan umum konsumen untuk rekap tamu hadir buat catering
- Generator link WhatsApp share: teks siap-kirim berisi nama tamu + link personalisasi (`?to=Nama`), mempermudah konsumen sebar ke banyak tamu
- Catatan: data wishes (nama, kehadiran tamu) adalah data pihak ketiga, bukan cuma milik konsumen — pertimbangkan alur hapus data kalau ada permintaan

---

## FASE 6 — Multi-Layout & Varian Warna (FUTURE, AGENT — belum prioritas, jangan eksekusi sebelum Fase 0-5 selesai kecuali diminta lain oleh pemilik projek)

- Buat **layout registry**: folder per layout di `src/lib/layouts/` (misal `classic/`, `modern/`, `minimalist/`), masing-masing punya `Layout.svelte`
- Kolom `template` (Fase 1a) diisi nama folder layout, misal `"classic"`
- Route dinamis memilih komponen layout secara dinamis lewat `<svelte:component this={layoutRegistry[data.invitation.template]} />`, dengan `layoutRegistry` berupa object mapping nama template ke komponen
- Semua layout wajib menerima **shape data yang sama** (struktur `data_json` Fase 1b) supaya nambah layout baru = nambah tampilan saja, tidak ubah cara data diambil
- Panel admin (Fase 5) tambah dropdown "pilih template" yang sinkron dengan `layoutRegistry`
- Varian warna sudah otomatis jalan lewat `theme` di `data_json` — tidak perlu kerja tambahan di fase ini

---

## FASE 7 — Custom Domain sebagai Upsell (FUTURE, opsional, tergantung keputusan bisnis)

- Beda sumbu dari Fase 6 (multi-layout): ini soal tier harga, bukan tampilan
- Kalau ada konsumen premium mau pakai domain sendiri (bukan `xxx.boundless.my.id`), tambahkan domain custom itu di Vercel project settings secara manual per klien (mirip Fase 0 poin 2, tapi per-klien bukan wildcard sekali di awal)
- Arsitektur subdomain yang sudah dibangun (Fase 1-5) tetap kompatibel — tinggal tambah 1 domain custom yang di-mapping ke row invitation yang sama di database, tidak perlu ubah skema

---

## Ringkasan Urutan
Fase 0 (manual) → Fase 1 (agent usul → manual approve → agent eksekusi) → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 (future) → Fase 7 (future, opsional)

---

# 📋 FASE 1 — USULAN SKEMA (siap review — status: MENUNGGU APPROVE)

> Ditulis agent 2026-09-06 sesuai amanat Fase 1a/1b. **Skema DIAPPROVE** (2026-09-06,
> vendor: **Supabase** — keputusan pemilik). Belum dieksekusi ke DB: menunggu Fase 0
> manual (project Supabase dibuat + env disiapkan), lalu eksekusi (Fase 1d).

## Keputusan kunci: pakai **Supabase** (keputusan pemilik, 2026-09-06)
Pemilik memilih Supabase (mengesampingkan usulan awal agent untuk tetap di Neon).
Catatan implementasi supaya transisi dari Neon aman:

1. **Driver DB**: `@neondatabase/serverless` TIDAK kompatibel dengan Supabase
   (protokol WebSocket khusus Neon). Ganti ke `postgres` (postgres.js) via koneksi
   **pooler Supavisor** (port 6543, pool mode) — perubahan kode minimal:
   `neon(url)` → `postgres(url)` di `src/lib/server/wishes.ts`, query SQL tetap.
   `@supabase/supabase-js` baru dibutuhkan saat Fase 5 (Storage untuk upload galeri).
2. **Env Vercel**: `DATABASE_URL` diganti connection string pooler Supabase:
   `postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:6543/postgres`
   (tambah `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` saat Fase 5).
3. **Migrasi data**: ekspor semua baris `guest_wishes` dari Neon (3 baris per
   2026-09-06), impor ke Supabase **sebelum** cutover env — produksi live, ucapan
   tamu tidak boleh hilang.
4. **RLS**: DB diakses hanya dari server (pooler + service role). RLS boleh
   di-enable dengan policy untuk `service_role`; anon key tidak dipakai untuk DB.
5. DDL Postgres murni — jalan apa adanya di Supabase SQL Editor;
   `gen_random_uuid()` tersedia bawaan. Kolom `guests` di `guest_wishes`
   (fitur stepper jumlah tamu) ikut dibuat di Supabase.

## 1a. DDL tabel `invitations`

```sql
CREATE TABLE IF NOT EXISTS invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain     TEXT NOT NULL UNIQUE
                CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'),
  nama_pihak_1  TEXT NOT NULL DEFAULT '',
  nama_pihak_2  TEXT NOT NULL DEFAULT '',
  tanggal_acara DATE,            -- tanggal acara utama (denormalisasi utk list admin & expiry)
  template      TEXT NOT NULL DEFAULT 'classic',
  data_json     JSONB NOT NULL DEFAULT '{}'::jsonb
                CHECK (jsonb_typeof(data_json) = 'object'),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','expired')),
  owner_email   TEXT,           -- null dulu (single admin); diisi saat multi-admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lookup utama: subdomain → invitation (unique index sudah cukup cepat)
-- index admin/list:
CREATE INDEX IF NOT EXISTS idx_invitations_status   ON invitations (status);
CREATE INDEX IF NOT EXISTS idx_invitations_created  ON invitations (created_at DESC);
-- query ke dalam JSONB (mis. cari undangan dgn gift provider tertentu):
CREATE INDEX IF NOT EXISTS idx_invitations_data_gin ON invitations USING GIN (data_json);

-- updated_at otomatis:
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Catatan desain:
- **`subdomain` = kunci bisnis** (unik, lowercase, format DNS-safe via CHECK — huruf kecil/angka/strip, 3–63 karakter). Reserved words (`www`, `admin`, `api`, `app`, `invite`, …) divalidasi di **app layer** (list bisa berkembang tanpa alter DB).
- **`tanggal_acara` denormalisasi**: sumber kebenaran tanggal tetap di `data_json.events[].date`; kolom ini hanya untuk listing admin & perhitungan expiry. Ditulis bersamaan oleh panel admin.
- **`status`** dikelola app layer: `draft → active → expired`. **Keputusan pemilik (2026-09-06): tanpa auto-expiry** — status diubah manual via panel admin; logika/kron expiry otomatis tidak diimplementasikan dulu (bisa ditambah belakangan tanpa ubah skema).
- UUID via `gen_random_uuid()` (pgcrypto bawaan Postgres ≥13, tidak perlu extension terpisah).

## 1b. Kontrak `data_json` (generik, lintas layout)

```jsonc
{
  "theme": { "primary": "#8b5e3c", "secondary": "#f5ebe0" },
  "personalize_greeting": true,

  // Identitas mempelai (baru diusulkan — dibutuhkan section Couple & Hero)
  "couple": {
    "bride": { "name": "Ruhaeni", "full_name": "Ruhaeni",
               "relation": "Putri Bungsu dari\\nBapak Nuryadin & Ibu Dedeh",
               "instagram": "", "whatsapp": "" },
    "groom": { "name": "Asep Roni", "full_name": "Asep Roni",
               "relation": "Putra Pertama dari\\nBapak Badri & Ibu Suryati",
               "instagram": "", "whatsapp": "" }
  },

  // Ayat/kutipan (opsional, null = section disembunyikan)
  "verse": { "arabic": "…", "translation": "…", "source": "— QS. Yā-Sīn : 36" },

  "events": [
    { "name": "Akad",   "date": "2026-09-20", "time": "08.00 WIB",
      "location": "…", "map_url": "…" },
    { "name": "Resepsi", "date": "2026-09-21", "time": "10.00 WIB — Selesai",
      "location": "…", "map_url": "…" }
  ],

  "gifts": [
    { "type": "ewallet", "provider": "DANA", "owner": "Ruhaeni", "number": "0857…" },
    { "type": "bank",    "provider": "BCA",  "owner": "Roni",    "number": "…" }
  ],

  "gallery": ["url1", "url2"],      // URL (Vercel Blob / CDN), bukan file repo
  "love_story": [
    { "title": "Pertemuan", "text": "…" },
    { "title": "Komitmen",  "text": "…" }
  ],

  "music_url": "/audio/wedding.mp3",   // opsional; null = tanpa musik
  "livestream_url": null               // opsional
}
```

Aturan main (wajib semua layout patuh):
- **Array untuk koleksi** (`events`, `gifts`, `gallery`, `love_story`) — 0/n elemen harus tidak bikin layout crash; section kosong = disembunyikan.
- **Field opsional = null/absen**, bukan string kosong; layout cek keberadaan sebelum render.
- Wishes/RSVP **TIDAK** masuk sini (tabel terpisah, terus bertumbuh, beri pagination).
- Guest personalization tetap dari query param `?to=Nama` — flag `personalize_greeting` menentukan render sapaan.

## Migrasi `guest_wishes` (pendamping — supaya ucapan terikat tenant)

```sql
ALTER TABLE guest_wishes
  ADD CONSTRAINT fk_guest_wishes_invitation
  FOREIGN KEY (wedding) REFERENCES invitations(subdomain) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_guest_wishes_wedding_created
  ON guest_wishes (wedding, created_at DESC);
```
- Kolom `wedding` (slug) dipertahankan — kode existing (`WHERE wedding = $slug`) tak berubah.
- `ON DELETE CASCADE`: hapus undangan ikut menghapus ucapan tamunya (data pihak ketiga — lihat catatan Fase 5).
- Index `(wedding, created_at DESC)` mempercepat query list & pagination halaman undangan.

## Rencana eksekusi (Fase 1d, SETELAH Fase 0 Supabase siap)
0. **Manual (Fase 0)**: buat project Supabase → catat project ref/region, password DB,
   dan connection string pooler; buka SQL Editor.
1. Jalankan DDL `invitations` (+ trigger + index) di Supabase.
2. Buat tabel `guest_wishes` (DDL sama dengan Neon, termasuk kolom `guests`),
   lalu impor data ucapan dari Neon.
3. Fase 2 sekalian: insert row pertama `subdomain='ruhaeni-roni'` dengan `data_json`
   hasil pemetaan `wedding.ts` (status `active`, template `classic`).
4. ALTER `guest_wishes` (FK ke `invitations(subdomain)` + index
   `(wedding, created_at DESC)`).
5. **Cutover kode**: `pnpm add postgres` → ganti `neon(url)` jadi `postgres(url)` di
   `wishes.ts` (sesuaikan cara eksekusi query), update `DATABASE_URL` di Vercel ke
   pooler Supabase, deploy, verifikasi `/api/wishes` 200 dan data lama utuh.
6. **Rollback plan**: kembalikan `DATABASE_URL` Vercel ke Neon (data Neon tidak
   disentuh → rollback instan). Di Supabase: `DROP TRIGGER/INDEX/TABLE invitations` +
   `ALTER TABLE guest_wishes DROP CONSTRAINT fk_guest_wishes_invitation`.
