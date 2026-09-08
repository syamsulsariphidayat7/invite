# Undangan — Undangan Pernikahan Digital (SvelteKit)

Platform undangan pernikahan digital **multi-undangan** (SaaS): satu kode,
banyak undangan. Setiap undangan punya slug sendiri (`invite.boundless.my.id/{slug}`),
kontennya tersimpan di database Supabase (`invitations.data_json`), dan
dikelola lewat panel admin.

**Stack:** SvelteKit (Svelte 5, runes) · TypeScript · Supabase Postgres
(driver `postgres`/postgres.js, pooler 6543) · Supabase Storage + sharp ·
Vercel (`@sveltejs/adapter-vercel`) · lucide-svelte

## Fitur

- 🎬 Layar sampul "Buka Undangan" + musik latar (audio / fallback YouTube)
- 👰🤵 Profil mempelai, ayat Al-Qur'an, hitung mundur, akad & resepsi
- 📅 Detail acara + tombol Save-the-Date ke Google Calendar
- 🖼️ Galeri foto + lightbox
- 💌 Love story, amplop digital, ucapan & doa tamu (anti-spam: rate limit +
  honeypot + Cloudflare Turnstile)
- 🎨 Multi-layout: `classic` & `rose` (dropdown di admin, preview `?template=`)
- 🔐 Panel admin `/admin` — CRUD undangan, tab Foto (storage + peran),
  tab Konten (editor `data_json`), moderasi & export ucapan/tamu
- 👥 Kelola tamu konsumen `/{slug}/kelola` (PIN 6-digit, bulk WhatsApp)
- 🛡️ Anti-XSS (relation mempelai di-escape), rate limit per-endpoint

## Struktur

```
src/
├── lib/
│   ├── data/wedding.ts      ← konten DEFAULT (fallback bila data_json kosong)
│   ├── data/resolve.ts      ← resolveWedding(dataJson): override DB → konten
│   ├── layouts/             ← multi-layout (classic/, rose/, registry, meta)
│   ├── server/              ← db.ts (postgres.js + helper jsonb), wishes,
│   │                          invitations, guests, rateLimit
│   ├── components/          ← komponen per section (Hero, Couple, Verse, ...)
│   └── music.svelte.ts      ← store musik (runes)
├── routes/
│   ├── +page.*              ← root: redirect / listing undangan aktif
│   ├── [slug]/              ← halaman undangan dinamis (+ /kelola ber-PIN)
│   ├── admin/               ← panel admin + login
│   └── api/                 ← wishes, guests(+template), admin/*, health
db/schema.sql                ← DDL Supabase (invitations, guest_wishes, invitation_guests)
scripts/                     ← migrate-to-supabase, migrate-media, seed-demo, check-db
```

## Persiapan Lokal

```sh
pnpm install
cp .env.example .env   # isi DATABASE_URL, ADMIN_PIN, SUPABASE_URL, SUPABASE_SECRET_KEY
pnpm dev
```

Buka http://localhost:5173 — preview tanpa layar sampul: tambahkan `?preview=1`.

### Database (Supabase)

1. Jalankan `db/schema.sql` sekali di Supabase SQL Editor.
2. `DATABASE_URL` = connection string pooler Supavisor (port 6543); parser
   custom tahan password berkarakter spesial (`?`).
3. Tanpa `DATABASE_URL` aplikasi tetap jalan dengan fallback in-memory
   (ucapan tidak tersimpan permanen).

## Deploy ke Vercel

- Sudah pakai `@sveltejs/adapter-vercel` (runtime Node, diset di
  `vite.config.ts` — tidak ada `svelte.config.js`).
- Push ke `main` → auto-deploy. Env: `DATABASE_URL`, `ADMIN_PIN`,
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`.

## Konten Undangan

- **Default:** `src/lib/data/wedding.ts` — dipakai bila `data_json` kosong.
- **Per undangan:** tab Konten di `/admin` → tersimpan di
  `invitations.data_json` (kontrak lengkap: `ARCHITECTURE.md` §5).
- **Foto:** tab Foto di `/admin` → Supabase Storage `invitation-photos/{slug}/`
  + kompresi sharp 1600px; peran Hero/Bride/Groom/Sampul di-assign dari galeri.

## Perintah

| Perintah     | Fungsi                              |
| ------------ | ----------------------------------- |
| `pnpm dev`   | Development server                  |
| `pnpm build` | Build produksi (adapter Vercel)     |
| `pnpm preview` | Pratinjau hasil build             |
| `pnpm check` | svelte-check + tsc (type checking)  |

## Dokumen Lain

- `PANDUAN.md` — panduan penggunaan (Admin / Konsumen / Tamu)
- `ARCHITECTURE.md` — peta arsitektur, skema DB, API, env
- `PROGRESS.md` — status fase pengembangan