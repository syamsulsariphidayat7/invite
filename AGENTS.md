# AGENTS.md — Undangan (Invite)

## Stack
- **Framework:** SvelteKit (TypeScript) — dibuat via `sv create`, Svelte 5 (runes)
- **Package manager:** pnpm (wajib; `pnpm-workspace.yaml` mengizinkan build script esbuild)
- **Database:** Supabase Postgres via pooler Supavisor (port 6543) menggunakan driver `postgres` (postgres.js, `prepare: false`); sebelumnya Neon (`@neondatabase/serverless`) — migrasi 2026-09. Fallback in-memory bila `DATABASE_URL` kosong.
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
- `src/lib/server/wishes.ts` — lapisan DB ucapan tamu (postgres.js → Supabase pooler, fallback in-memory bila `DATABASE_URL` kosong; auto-create tabel `guest_wishes`).
- `src/routes/api/wishes/+server.ts` — API ucapan: `POST` (validasi nama ≥ `minName`, pesan ≥ `minMessage`, `attendance` di-normalisasi lowercase) & `GET`.
- `src/lib/components/` — satu komponen per section (Hero, Couple, Events, Gallery, Wishes, ...).
- `static/photos/` — foto mempelai & galeri; placeholder SVG di `static/photos/placeholders/` (daftar file yang perlu diganti: `static/photos/README.md`).
- Mode pratinjau: `?preview=1` melewati layar sampul "Buka Undangan".

## Konvensi
- `.env` **wajib** di-gitignore (sudah); `.env.example` diupdate tiap ada variabel baru. Saat ini: `DATABASE_URL` (Supabase pooler).
- Commit utama pakai `feat:` (conventional commits).
- Bahasa konten undangan: Indonesia.
- Jangan sentuh proyek lain di `/srv/http` — hanya kerjakan di repo ini.
- **Jangan commit atau push setiap perubahan.** Biarkan perubahan di working tree; commit sekaligus dalam satu commit ringkas hanya saat user minta (mis. "commit", "push", "deploy", atau instruksi serupa).

## Arah Pengembangan (SaaS multi-tenant — rencana Boundless)
- Skema `invitations` + `guest_wishes` DIAPPROVE (2026-09-06): lihat `db/schema.sql` & `rencana-agent-boundless-invitation.md`.
- Script migrasi: `scripts/migrate-to-supabase.mjs` (Neon → Supabase, idempoten).
- Subdomain dinamis (`ruhaeni-roni.boundless.my.id`) via wildcard Cloudflare+Vercel — **SKIP (opsional, Fase 7)**; routing utama tetap path-based `invite.boundless.my.id/{slug}`.
- Panel admin `/admin` terproteksi untuk CRUD undangan & moderasi ucapan (Fase 5).