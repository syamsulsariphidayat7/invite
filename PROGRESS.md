# PROGRESS.md — Undangan (Invite)

Terakhir diperbarui: 2026-09-07

## Fase Aktif
**Anti-spam + Galeri Storage + WA mass-share** — rate limit + honeypot, upload auto-sync `data_json.gallery`, bulk select WA.

## Status Fase
| Fase | Status |
| ---- | ------ |
| Discovery & Design | ✅ Selesai (referensi: lovestory.web.id/amel-dendi; data Ruhaeni & Roni) |
| Setup (scaffold, deps, adapter Vercel) | ✅ Selesai |
| Development (konten, DB, komponen UI) | ✅ Selesai |
| Integration & Testing | ✅ Selesai (svelte-check 0 error, build OK, API Neon 201/400 OK, screenshot OK) |
| Polish UI (Hero, Batik, Font, Nav, Progress) | ✅ Selesai |
| Dynamic Slug Routing `/[slug]` | ✅ Selesai (`/ruhaeni-roni`) |
| Kelola Tamu Konsumen (PIN, `/[slug]/kelola`) | ✅ Selesai — DB `invitation_guests`, API `/api/guests`, konsumen self-service |
| Panel Admin `/admin` | ✅ Selesai — `ADMIN_PIN` + `hooks.server.ts` + `invitations` CRUD + upload Storage + moderasi |
| Anti-spam (rate limit + honeypot) | ✅ Selesai — `rateLimit.ts`, `/api/wishes` 6/menit + `/api/guests` 20/menit, honeypot `website` |
| Galeri Storage → `data_json.gallery` | ✅ Selesai — upload auto-append gallery (Photo direct URL), sinkron ke `/[slug]` |
| WA Mass-share | ✅ Selesai — bulk select di `/{slug}/kelola`, salin link massal + buka WA berurutan + tandai terkirim |
| Pre-production Cleanup | ✅ Selesai |
| Deployment (Vercel + Neon) | ✅ Selesai — auto-deploy dari GitHub, custom domain `invite.boundless.my.id`, `DATABASE_URL` aktif (API ucapan 200 + data terbaca, 2026-09-06) |

## Sedang Dikerjakan
- (kosong — `guest_wishes` bersih, verifikasi 2026-09-07: 0 baris di Supabase)

## Sudah Selesai
- Undangan lengkap: layar sampul + musik, hero, mempelai, ayat, countdown, akad & resepsi (20–21 Sep 2026), galeri, love story 3 bab, amplop digital, ucapan tamu → Neon, nav bawah, footer.
- Verifikasi penuh: `pnpm check` (0 error), `pnpm build` (exit 0), API `/api/wishes` tersimpan & terbaca di Neon, screenshot mobile & desktop.
- Polish: Hero center + flower-decor, veil abu bottom+halo atas, batik Semen PNG cover no-repeat, font mempelai Great Vibes + `&` flex gap 0.28em, palet abu, reveal Hero/Batik.
- Dynamic Slug Routing: rute dinamis `/[slug]` (`/ruhaeni-roni`), root `/` auto-redirect ke `/${wedding.slug}`, `/tamu` generator link otomatis ke `/${wedding.slug}?to=...`.
- Ucapan & Kehadiran: form di atas list, stepper jumlah kehadiran (1-10 orang), pagination 3 ucapan/halaman.
- Nav & Scroll: sticky top countdown saat scroll, bottom nav active indicator sesuai posisi scroll, scroll progress bar top.
- Data produksi 2026-09-06: DANA Ruhaeni 085724087380 & Asep Roni 085624398337, IG _ruhaeni & ronii_wiguna, footer link Boundless `http://boundless.my.id/`.
- Kelola Tamu Konsumen: `/{slug}/kelola` PIN 6-digit per undangan, `api/guests` CRUD + `invitation_guests` (sent/sent_at, dedup normalized_name), `/tamu` legacy tetap; `invitations.access_pin + wa_template`.
 - Panel Admin `/admin`: login `ADMIN_PIN` env (`hooks.server.ts` + `admin_pin` httpOnly cookie), CRUD `invitations` (`api/admin/invitations`), detail tamu/ucapan per subdomain, export CSV, upload galeri `invitation-photos/{slug}/` ke Supabase Storage (`@supabase/supabase-js` + `SUPABASE_URL/SECRET_KEY`, bucket Public) — auto-sync `data_json.gallery`.
 - Anti-spam: `rateLimit.ts` in-memory (`wishes` 6/min/IP, `guests` 20/min/IP/slug) + honeypot field `website` (silent 201 jika terisi).
 - WA Mass-share: `/{slug}/kelola` bulk checkbox, pilih semua filtered, salin link massal, kirim WA berurutan + auto tandai terkirim.
- SEO & Open Graph Preview: meta `og:image`, `og:url`, `og:title`, `og:description`, `twitter:card` summary_large_image, canonical link ke `https://invite.boundless.my.id/ruhaeni-roni`.
- Kompresi Foto: 15 foto dioptimasi (max 1600px, quality 82%, interlaced), ukuran total turun dari ~28 MB ke ~4.3 MB (hemat 85% bandwidth).

## Blocker / Catatan
- **Cutover Supabase SELESAI & terverifikasi** (2026-09-06): project Supabase baru `mommziwcknrbhhtecgrm` (pooler 6543), driver `postgres` (postgres.js), parser `DATABASE_URL` custom tahan password berkarakter spesial (`?` memutus `new URL()` driver → in-memory). GET/POST `/api/wishes` produksi ✅ menulis-baca DB Supabase.
- **Data lama Neon dibuang** (keputusan pemilik — 3 ucapan uji tidak diperlukan); Neon tinggal dinonaktifkan/dihapus. Isu password Neon terekspos otomatis moot.
- **Foto asli sudah terpasang** (Sep 2026): 15 foto di-rename ke nama template — hero, bride, groom, gallery-1..12. Bride/groom sudah dikonfirmasi via file `pria.jpg`/`wanita.jpg` dari user.
- **Musik latar aktif**: `/audio/wedding.mp3` offline (Christina Perri — A Thousand Years), mulai detik ke-5 (`wedding.ts:music`).
- **Batik**: `static/batik/batik-semen.png` 600×600 PNG tunggal, `BatikTexture` cover no-repeat 440px 0.16, dark via invert.

## Langkah Berikutnya
1. ✅ Push commit awal ke GitHub — commit `d6a2938` di `main` (repo: syamsulsariphidayat7/invite)
2. ✅ Import repo di Vercel, set `DATABASE_URL`, deploy — live di Supabase (terverifikasi 2026-09-06)
3. ✅ Custom domain di Vercel: `invite.boundless.my.id` — aktif (wildcard `*.boundless.my.id` SKIP — opsional Fase 7)
4. ✅ Ganti foto placeholder dengan foto asli — 15 foto terpasang (hero, bride, groom, galeri 12)
5. ✅ Musik latar — A Thousand Years (offline mp3)
6. ✅ Polish & cleanup — done 2026-09-06
7. ✅ Data produksi rekening DANA & IG
8. ✅ Slug routing `/[slug]` (`/ruhaeni-roni`) — path-based aktif; subdomain via Fase 7 opsional
9. ✅ Kelola tamu konsumen `/[slug]/kelola` (PIN, DB-synced, bulk WA)
10. ✅ Panel admin `/admin` (ADMIN_PIN + CRUD + Storage auto-gallery)
11. ✅ Anti-spam + honeypot + rate limit
