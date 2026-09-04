# Undangan — Undangan Pernikahan (SvelteKit)

Undangan digital pernikahan Ruhaeni & Roni, replika UI dari
[lovestory.web.id/amel-dendi](https://lovestory.web.id/amel-dendi/) dengan
tumpukan **SvelteKit + TypeScript + Neon Postgres**, dirancang agar mudah
berkembang menjadi platform **multi-tema + panel admin**.

## Fitur

- 🎬 Layar sampul "Buka Undangan" + musik latar (tombol play/pause)
- 👰🤵 Profil mempelai, ayat, dan hitung mundur menuju acara
- 📅 Detail acara Akad & Resepsi (tanggal, jam, lokasi) dengan tombol
  tambah ke Google Calendar
- 🖼️ Galeri foto
- 💌 Love story 3 bab (Pertemuan, Komitmen, Menikah)
- 💳 Amplop digital (rekening & QRIS)
- 💬 Ucapan & doa tamu tersimpan ke **Neon Postgres** (dengan fallback
  memori bila DB tidak terhubung)
- 📱 Navigasi bawah & desain responsif mobile-first
- 🌙 Ornamen & font dekoratif sesuai referensi

## Struktur Proyek

```
src/
├── lib/
│   ├── data/wedding.ts      ← SEMUA konten undangan di satu file (ganti di sini)
│   ├── server/wishes.ts     ← Lapisan DB (Neon) untuk ucapan tamu
│   ├── music.svelte.ts      ← Store musik (svelte 5 runes)
│   ├── assets/              ← favicon & aset
│   └── components/          ← Komponen per section (Hero, Couple, Events, ...)
├── routes/
│   ├── +page.server.ts      ← Loader (fetch ucapan dari DB, SSR)
│   ├── +page.svelte         ← Halaman utama
│   └── api/wishes/+server.ts← Endpoint API ucapan (POST + GET)
static/
└── photos/                  ← Tempat foto mempelai & galeri (lihat README di folder itu)
```

## Persiapan Lokal

```sh
pnpm install
cp .env.example .env   # isi DATABASE_URL dengan string koneksi Neon
pnpm dev
```

Buka http://localhost:5173 — untuk pratinjau tanpa menekan tombol
"Buka Undangan", tambahkan `?preview=1` di URL.

### Database (Neon Postgres)

1. Buat project di [neon.tech](https://neon.tech) (tier gratis cukup).
2. Salin connection string **pooled** (`-pooler`):
   `postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require`
3. Masukkan ke `.env` sebagai `DATABASE_URL`.
4. Buat tabel (otomatis dibuat saat pertama kali ada ucapan masuk, atau jalankan
   manual):

```sql
CREATE TABLE IF NOT EXISTS guest_wishes (
  id          SERIAL PRIMARY KEY,
  wedding     TEXT NOT NULL DEFAULT 'ruhaeni-roni',
  name        TEXT NOT NULL,
  attendance  TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> 🔒 **Keamanan:** `DATABASE_URL` jangan pernah dimasukkan ke git —
> `.env` sudah ter-gitignore. Jika string koneksi pernah bocor (misal terkirim
> lewat chat), segera **Reset password** di dashboard Neon.

## Deploy ke Vercel

Proyek sudah pakai `@sveltejs/adapter-vercel` (runtime Node).

1. Push repo ke GitHub/GitLab, lalu **Import** di [vercel.com](https://vercel.com).
2. Framework preset terdeteksi otomatis: **SvelteKit**. Build command: `pnpm build`.
3. Tambahkan environment variable `DATABASE_URL` di **Settings → Environment Variables**
   (paste string koneksi Neon; untuk production sebaiknya buat role/database khusus).
4. Deploy. Endpoint API ucapan (`/api/wishes`) jalan sebagai serverless function
   dan terhubung ke Neon via koneksi pooled.

## Mengganti Konten Undangan

Semua konten ada di **`src/lib/data/wedding.ts`**: nama mempelai, orang tua,
tanggal/jam/lokasi akad & resepsi, love story, rekening, musik (YouTube ID),
hingga slug undangan. Foto diarahkan ke `static/photos/` — lihat
`static/photos/README.md` untuk daftar file yang perlu diganti.

## Arah Multi-Tema + Panel Admin

Saat ini konten statis di `wedding.ts` dan slug tunggal. Untuk berkembang jadi
platform multi-tema:

- **Data per undangan**: pindahkan `wedding.ts` ke tabel `weddings` di Neon
  (kolom JSONB untuk konten + kolom `theme`), rute dinamis `/invitation/[slug]`.
- **Ucapan**: kolom `wedding` di `guest_wishes` sudah siap diisi slug undangan.
- **Panel admin**: tambah rute `/admin` terproteksi (auth) untuk CRUD undangan,
  galeri, dan moderasi ucapan — cukup membaca/menulis tabel yang sama.

## Skrip

| Perintah         | Fungsi                              |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Development server                  |
| `pnpm build`     | Build produksi (adapter Vercel)     |
| `pnpm preview`   | Pratinjau hasil build               |
| `pnpm check`     | Svelte-check + tsc (type checking)  |