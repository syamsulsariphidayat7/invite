# AGENTS.md — Undangan (Invite)

## Stack
- **Framework:** SvelteKit (TypeScript) — dibuat via `sv create`, Svelte 5 (runes)
- **Package manager:** pnpm (wajib; `pnpm-workspace.yaml` mengizinkan build script esbuild)
- **Database:** Neon Postgres (serverless) via `@neondatabase/serverless` — koneksi pooled
- **Deploy:** Vercel (`@sveltejs/adapter-vercel`, runtime Node; `vite.config.ts` menetapkan runtime eksplisit supaya lolos cek versi Node lokal)
- **Ikon:** lucide-svelte; font dekoratif via Google Fonts (`src/app.html`)

## Perintah
| Perintah       | Fungsi                          |
| -------------- | ------------------------------- |
| `pnpm dev`     | Dev server (default :5173)      |
| `pnpm build`   | Build produksi (adapter Vercel) |
| `pnpm preview` | Pratinjau hasil build           |
| `pnpm check`   | svelte-check + tsc              |

## Struktur Penting
- `src/lib/data/wedding.ts` — **SEMUA konten undangan** (nama, tanggal, lokasi, love story, rekening, musik, slug). Ganti konten di sini.
- `src/lib/server/wishes.ts` — lapisan DB ucapan tamu (Neon, fallback in-memory bila `DATABASE_URL` kosong; auto-create tabel `guest_wishes`).
- `src/routes/api/wishes/+server.ts` — API ucapan: `POST` (validasi nama ≥ `minName`, pesan ≥ `minMessage`, `attendance` di-normalisasi lowercase) & `GET`.
- `src/lib/components/` — satu komponen per section (Hero, Couple, Events, Gallery, Wishes, ...).
- `static/photos/` — foto mempelai & galeri; placeholder SVG di `static/photos/placeholders/` (daftar file yang perlu diganti: `static/photos/README.md`).
- Mode pratinjau: `?preview=1` melewati layar sampul "Buka Undangan".

## Konvensi
- `.env` **wajib** di-gitignore (sudah); `.env.example` diupdate tiap ada variabel baru. Saat ini hanya `DATABASE_URL`.
- Commit utama pakai `feat:` (conventional commits).
- Bahasa konten undangan: Indonesia.
- Jangan sentuh proyek lain di `/srv/http` — hanya kerjakan di repo ini.

## Arah Pengembangan (SaaS multi-tema + panel admin)
- Konten pindah dari `wedding.ts` ke tabel `weddings` (JSONB + kolom `theme`), rute dinamis `/invitation/[slug]`.
- Kolom `wedding` di `guest_wishes` sudah siap per-slug.
- Panel admin `/admin` terproteksi untuk CRUD undangan & moderasi ucapan.
- Detail: lihat `README.md` bagian "Arah Multi-Tema + Panel Admin".