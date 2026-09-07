# ARCHITECTURE.md — Peta Arsitektur Proyek Undangan

Dibuat dari pemindaian menyeluruh (2026-09-07). Ini peta referensi: struktur, alur data, DB, API, env, dan catatan pengembangan.

## 1. Stack

| Lapisan | Pilihan |
|---|---|
| Framework | SvelteKit 2 (Svelte 5, runes mode dipaksa via `vite.config.ts`) |
| Bahasa | TypeScript strict |
| Package manager | pnpm (workspace `pnpm-workspace.yaml` untuk esbuild) |
| Database | Supabase Postgres (pooler Supavisor port 6543, mode transaksi), driver `postgres` (postgres.js), `prepare: false` |
| Storage | Supabase Storage bucket `invitation-photos/{slug}/` via `@supabase/supabase-js` + kompresi `sharp` (1600px JPEG q82 mozjpeg) |
| Deploy | Vercel (`@sveltejs/adapter-vercel`, runtime `nodejs24.x` — dikonfigurasi di `vite.config.ts`, **tidak ada `svelte.config.js`**) |
| Anti-spam | Rate limit in-memory + honeypot + Cloudflare Turnstile (kode siap, env belum) |
| Ikon/font | lucide-svelte; Google Fonts di `src/app.html` |
| Export admin | exceljs (XLSX) + jspdf (PDF) |

## 2. Alur Request

```
Browser → Vercel → hooks.server.ts (auth admin) → route (+page.server.ts / API)
   ├─ halaman undangan  : getInvitation(slug) → resolveWedding(dataJson) → komponen
   ├─ API publik        : rate limit + honeypot + Turnstile (opsional) → db()
   └─ API admin         : wajib cookie admin_pin (httpOnly) → CRUD
```

- `hooks.server.ts`: cek cookie `admin_pin` = `ADMIN_PIN` → `locals.adminAuthed`; blokir `/admin*` & `/api/admin*` (401/redirect ke login).
- Root `+page.server.ts`: redirect 307 ke `/{slug}` — listing bila >1 undangan aktif.

## 3. Peta Direktori

```
src/
├─ app.html              # shell HTML: font Google, class .js, %sveltekit.head/body%
├─ app.d.ts              # App.Locals.adminAuthed
├─ hooks.server.ts       # auth admin (cookie admin_pin)
├─ lib/
│  ├─ assets/favicon.svg
│  ├─ index.ts           # kosong (placeholder $lib)
│  ├─ music.svelte.ts    # player musik global: Audio/YouTube fallback, store, setMusicSrc
│  ├─ data/
│  │  ├─ wedding.ts      # KONTEN DEFAULT + tipe (Person, EventDetail, BankAccount, StoryChapter, Wish)
│  │  └─ resolve.ts      # resolveWedding(dataJson): override konten DB → objek ResolvedWedding
│  ├─ server/
│  │  ├─ wishes.ts       # repo ucapan: listWishes/countWishes/addWish (DB/in-memory)
│  │  ├─ invitations.ts  # repo invitations: CRUD + validateSubdomain + dbConfigFromUrl
│  │  ├─ guests.ts       # repo invitation_guests: PIN verify, CRUD, auto-create tabel/kolom
│  │  └─ rateLimit.ts    # checkRateLimit + clientKey (in-memory Map)
│  └─ components/        # satu komponen per section (lihat §6)
└─ routes/
   ├─ +layout.server.ts  # ekspos TURNSTILE_SITE_KEY
   ├─ +layout.svelte     # design system CSS global, meta SEO/OG, meta turnstile
   ├─ +page.{server,svelte}.ts  # root: redirect / listing undangan aktif
   ├─ [slug]/            # halaman undangan dinamis
   │  ├─ +page.server.ts # load: getInvitation + wishes + gallery + resolveWedding
   │  ├─ +page.svelte    # susun komponen, overlay, reveal observer, theme override
   │  └─ kelola/         # kelola tamu konsumen (PIN 6-digit, bulk WA)
   ├─ tamu/              # LEGACY kelola tamu (localStorage) — masih aktif
   ├─ admin/             # panel admin (login + dashboard)
   │  └─ login/
   └─ api/
      ├─ health/         # keep-warm (cron Vercel 06:00)
      ├─ wishes/         # publik: GET list, POST tambah (rate 6/menit + captcha)
      ├─ guests/         # publik ber-PIN: CRUD tamu + template WA
      └─ admin/          # login, invitations, wishes (moderasi+export), upload (Storage)
db/schema.sql            # DDL: invitations, guest_wishes, trigger updated_at, FK, index
scripts/
├─ migrate-to-supabase.mjs  # migrasi Neon→Supabase (idempoten)
└─ check-db.mjs             # diagnosa koneksi DB (config object, bukan URL)
static/
├─ audio/wedding.mp3    # musik offline (A Thousand Years)
├─ batik/batik-semen.png # tekstur batik
├─ decor/flower-ed-02.png
├─ photos/              # hero, bride, groom, gallery-1..12 (jpg)
│  └─ placeholders/*.svg # fallback bila file asli hilang
└─ robots.txt
```

## 4. Tabel Database (Supabase, schema public)

**`invitations`** — master undangan
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| subdomain | TEXT UNIQUE | CHECK format `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$`; reserved words divalidasi di app |
| nama_pihak_1 / nama_pihak_2 | TEXT | untuk listing/overview |
| tanggal_acara | DATE | denormalisasi |
| template | TEXT | `'classic'` (Fase 6: pilih layout) |
| data_json | JSONB | kontrak generik §5, CHECK object |
| status | TEXT | CHECK draft/active/expired |
| owner_email | TEXT | nullable |
| access_pin | TEXT | PIN kelola tamu konsumen |
| wa_template | TEXT | template pesan WA |
| created_at / updated_at | TIMESTAMPTZ | updated_at via trigger `set_updated_at` |

**`guest_wishes`** — ucapan tamu (per slug)
| Kolom | Catatan |
|---|---|
| id SERIAL PK, wedding TEXT | slug undangan, FK → invitations(subdomain) ON DELETE CASCADE |
| name, message, guests | validasi di API |
| attendance | CHECK hadir/tidak |
| created_at | index `(wedding, created_at DESC)` |

**`invitation_guests`** — daftar tamu kelola (per undangan)
id UUID, invitation_id FK CASCADE, wedding, name, normalized_name (dedup), sent, sent_at, created_at. Auto-create + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` di `guests.ts:init()`.

## 5. Kontrak `data_json` (generik, lintas layout)

Dipetakan di `resolve.ts`; setiap kunci opsional (kosong = fallback ke `wedding.ts`):
```
theme:  { primary, secondary }                     → override CSS vars (--ink/--paper)
couple: { bride:{name,full_name,relation,instagram,whatsapp}, groom:{...} }
photos: { hero, bride, groom, cover } + gallery[]  → cover dipakai sampul overlay
gallery: string[] (URL Supabase / nama file)
verse:  { arabic, translation, source } | null
events: [{ name, date, time, location, map_url }]  → 1 event = resepsi, ≥2 = akad+resepsi; venue dari sini bila tak ada venue eksplisit
gifts:  [{ type, provider, owner, number }]
gift_note: string
love_story: [{ title, text }], love_story_intro: string
venue:  { name, address, maps_url }                → menang atas turunan events
social: { whatsapp, instagram }                    → footer
instagram_filter_url: string
wishes: { minName, minMessage, note }
music:  { src, youtubeId, startSeconds } (atau kunci datar music_url / music_youtube_id / music_start_seconds)
livestream_url: string
personalize_greeting: boolean
```
`resolveWedding` mengembalikan objek = `wedding` default + override, plus `resolved:true`, `eventCount`, `calendarUrlResolved`, `_theme`, `_livestream`, `_personalize`.

## 6. Komponen UI (semua di `src/lib/components/`)

| Komponen | Konten | Props |
|---|---|---|
| Overlay | sampul "Buka Undangan" | guest, closed, onopen — ⚠️ masih pakai `wedding` statis |
| Hero | foto, nama, tanggal, Save-the-Date, partikel | weddingData |
| Couple | 2 mempelai + sosmed (relation di-escape anti-XSS) | weddingData |
| Verse | ayat Al-Qur'an | weddingData |
| Events | countdown + kartu akad/resepsi + sticky countdown | weddingData |
| Gallery | grid + lightbox + blok IG filter | gallery, weddingData |
| LoveStory | timeline bab | weddingData |
| Gift | amplop digital, salin nomor | weddingData |
| Wishes | form ucapan (stepper kehadiran, Turnstile, pagination) | initialWishes, initialTotal, guestName, slug, weddingData |
| Footer | nama, tanggal, kredit Boundless | weddingData |
| MusicToggle | tombol play/pause musik | weddingData |
| BottomNav / ScrollProgress | navigasi & progress bar | — |
| Photo | coba .jpg→.jpeg→.png→.webp→placeholder.svg | base, alt, eager |
| Particles / Ornament / BatikTexture / SocialIcon | dekorasi | — |

Pola konsisten: `weddingData` prop + `const w = $derived((weddingData ?? wedding))`.

## 7. API Endpoints

| Rute | Auth | Fungsi |
|---|---|---|
| `GET/POST /api/wishes` | publik (rate 6/menit/IP, honeypot, Turnstile opsional) | list/paginasi ucapan per slug; tambah ucapan + kehadiran |
| `GET/POST/PATCH/DELETE /api/guests` | PIN (`x-pin`/`?pin`) | kelola tamu konsumen, 20/menit |
| `GET /api/guests/template` | PIN | template WA |
| `GET/POST/PATCH/DELETE /api/admin/invitations` | admin | CRUD undangan (validasi subdomain, status, dataJson) |
| `POST/DELETE /api/admin/login` | — | login/logout PIN (rate 5/15 menit) |
| `GET/DELETE /api/admin/wishes` | admin | moderasi ucapan + export XLSX/PDF (tamu/ucapan) |
| `POST/DELETE /api/admin/upload` | admin | upload sharp ke Storage (kind: gallery/hero/bride/groom/cover), hapus/reorder |
| `GET /api/health` | — | keep-warm (cron Vercel `0 6 * * *`) |

## 8. Environment Variables

| Var | Peran | Diisi |
|---|---|---|
| `DATABASE_URL` | pooler Supabase 6543 (parser custom tahan password `?`) | ✅ lokal & Vercel |
| `ADMIN_PIN` | login admin | ✅ |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Storage upload | ✅ |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | captcha form ucapan | ⏳ belum |

`.env` di-gitignore; `.env.example` jadi referensi.

## 9. Temuan / Catatan (dari pemindaian)

1. **Duplikasi koneksi DB**: `dbConfigFromUrl()`+`db()` diulang di 4 file (`wishes.ts`, `invitations.ts`, `guests.ts`, `api/admin/wishes/+server.ts`) → kandidat refactor ke `src/lib/server/db.ts`.
2. **Overlay belum memakai `weddingData`** — cover/teks sampul tetap dari `wedding.ts` walau `photos.cover` sudah diresolve per-undangan (gap kecil vs fitur cover admin).
3. **Dua sistem kelola tamu**: `/tamu` (legacy localStorage, hardcoded slug) vs `/[slug]/kelola` (DB, multi-tenant) — legacy bisa dihapus saat sudah yakin.
4. **Rate limit in-memory** — reset saat instance restart (cukup untuk 1 instance Vercel; catatan untuk skala).
5. `vite.config.ts` menyetel `runes: true` global — komponen wajib pola runes.
6. `static/photos/placeholders/` masih ada sebagai fallback Photo (bukan bug).
7. Halaman `/[slug]` meng-hide section bila datanya kosong (mis. livestream, IG filter, verse null) — kontrak "section kosong = disembunyikan" sudah terpenuhi sebagian (Verse/Gallery/Events sudah; sisanya lewat fallback wedding.ts).