# PROGRESS.md — Undangan (Invite)

Terakhir diperbarui: 2026-09-07

## Fase Aktif
**Tidak ada fase besar sedang berjalan** — semua fitur inti selesai (per 2026-09-07). Item terbuka hanya operasional: isi env Turnstile (kode sudah siap), bersihkan data uji, matikan Neon lama. Fase 6 (multi-layout) & 7 (custom domain) masih future.

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
| Admin Full Editor | ✅ Selesai — tab Konten di `/admin`: events, gifts, couple, ayat, story, theme, music + **gift note, venue, social, IG filter, wishes, music YT/startSeconds, cover** |
| Sharp Kompresi | ✅ Selesai — upload auto-resize 1600px JPEG 82 mozjpeg, gallery hapus/reorder |
| Login Rate Limit | ✅ Selesai — `admin-login` 5/15 menit |
| dataJson Wiring | ✅ Selesai — `resolve.ts` override penuh ke `/[slug]`: gift.note, venue, social, wishes, instagramFilterUrl, music youtubeId/startSeconds, photos cover |
| Turnstile meta | ✅ Kode siap — `+layout.server.ts` ekspos `TURNSTILE_SITE_KEY` → `<meta name=turnstile-sitekey>`; Wishes API wajib token bila `TURNSTILE_SECRET_KEY` terisi. ⏳ env belum diisi |
| Anti-XSS | ✅ Selesai — `@html` relation Couple di-escape dulu (`safeRelation`), input admin tidak bisa injeksi HTML |
| Pre-production Cleanup | ✅ Selesai |
| Deployment (Vercel + Neon) | ✅ Selesai — auto-deploy dari GitHub, custom domain `invite.boundless.my.id`, `DATABASE_URL` aktif (API ucapan 200 + data terbaca, 2026-09-06) |

## Sedang Dikerjakan
- (kosong — lihat Langkah Berikutnya)

## Sudah Selesai
- Undangan lengkap: layar sampul + musik, hero, mempelai, ayat, countdown, akad & resepsi (20–21 Sep 2026), galeri, love story 3 bab, amplop digital, ucapan tamu → Neon, nav bawah, footer.
- Verifikasi penuh: `pnpm check` (0 error), `pnpm build` (exit 0), API `/api/wishes` tersimpan & terbaca di Neon, screenshot mobile & desktop.
- Polish: Hero center + flower-decor, veil abu bottom+halo atas, batik Semen PNG cover no-repeat, font mempelai Great Vibes + `&` flex gap 0.28em, palet abu, reveal Hero/Batik.
- Dynamic Slug Routing: rute dinamis `/[slug]` (`/ruhaeni-roni`), root `/` auto-redirect ke `/${wedding.slug}`, `/tamu` generator link otomatis ke `/${wedding.slug}?to=...`.
- Ucapan & Kehadiran: form di atas list, stepper jumlah kehadiran (1-10 orang), pagination 3 ucapan/halaman.
- Nav & Scroll: sticky top countdown saat scroll, bottom nav active indicator sesuai posisi scroll, scroll progress bar top.
- Data produksi 2026-09-06: DANA Ruhaeni 085724087380 & Asep Roni 085624398337, IG _ruhaeni & ronii_wiguna, footer link Boundless `http://boundless.my.id/`.
- Kelola Tamu Konsumen: `/{slug}/kelola` PIN 6-digit per undangan, `api/guests` CRUD + `invitation_guests` (sent/sent_at, dedup normalized_name), `/tamu` legacy tetap; `invitations.access_pin + wa_template`.
 - Panel Admin `/admin`: login `ADMIN_PIN` env (`hooks.server.ts` + `admin_pin` httpOnly cookie + 5/15 menit rate limit), CRUD `invitations` + tab Konten lengkap `data_json` + gallery manage (hapus/reorder) + upload `invitation-photos/{slug}/` (sharp 1600px) — auto-sync `resolve.ts` ke `/[slug]`.
 - Anti-spam: `rateLimit.ts` in-memory (`wishes` 6/min/IP, `guests` 20/min/IP/slug, `admin-login` 5/15m) + honeypot `website` (silent 201).
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
1. ✅ Semua fase inti selesai: deploy, domain, foto, musik, slug, kelola tamu, admin, anti-spam, dataJson wiring (commit terbaru `0ea0b38`, terverifikasi live 2026-09-07)
2. ⏳ **Aktifkan Turnstile**: isi `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` di Vercel & `.env` (kode sudah siap, meta sudah ter-render di produksi)
3. ⏳ **Bersihkan**: 1 baris tamu uji di `invitation_guests`; nonaktifkan project Neon lama
4. ⏳ Fase 6 (multi-layout) — future, butuh keputusan desain
5. ⏳ Fase 7 (custom domain per klien) — future, opsional
