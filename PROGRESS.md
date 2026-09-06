# PROGRESS.md — Undangan (Invite)

Terakhir diperbarui: 2026-09-06

## Fase Aktif
**Polish & Pre-production Cleanup** — Slug routing, pagination ucapan, dan kustomisasi selesai.

## Status Fase
| Fase | Status |
| ---- | ------ |
| Discovery & Design | ✅ Selesai (referensi: lovestory.web.id/amel-dendi; data Ruhaeni & Roni) |
| Setup (scaffold, deps, adapter Vercel) | ✅ Selesai |
| Development (konten, DB, komponen UI) | ✅ Selesai |
| Integration & Testing | ✅ Selesai (svelte-check 0 error, build OK, API Neon 201/400 OK, screenshot OK) |
| Polish UI (Hero, Batik, Font, Nav, Progress) | ✅ Selesai |
| Dynamic Slug Routing `/[slug]` | ✅ Selesai (`/ruhaeni-roni`) |
| Pre-production Cleanup | ✅ Selesai |
| Deployment (Vercel + Neon) | 🔄 Berjalan — commit/push pertama; deploy Vercel menyusul |

## Sedang Dikerjakan
- Import repo di Vercel + set `DATABASE_URL` + deploy.

## Sudah Selesai
- Undangan lengkap: layar sampul + musik, hero, mempelai, ayat, countdown, akad & resepsi (20–21 Sep 2026), galeri, love story 3 bab, amplop digital, ucapan tamu → Neon, nav bawah, footer.
- Verifikasi penuh: `pnpm check` (0 error), `pnpm build` (exit 0), API `/api/wishes` tersimpan & terbaca di Neon, screenshot mobile & desktop.
- Polish: Hero center + flower-decor, veil abu bottom+halo atas, batik Semen PNG cover no-repeat, font mempelai Great Vibes + `&` flex gap 0.28em, palet abu, reveal Hero/Batik.
- Dynamic Slug Routing: rute dinamis `/[slug]` (`/ruhaeni-roni`), root `/` auto-redirect ke `/${wedding.slug}`, `/tamu` generator link otomatis ke `/${wedding.slug}?to=...`.
- Ucapan & Kehadiran: form di atas list, stepper jumlah kehadiran (1-10 orang), pagination 3 ucapan/halaman.
- Nav & Scroll: sticky top countdown saat scroll, bottom nav active indicator sesuai posisi scroll, scroll progress bar top.
- Data produksi 2026-09-06: DANA Ruhaeni 085724087380 & Asep Roni 085624398337, IG _ruhaeni & ronii_wiguna, footer link Boundless `http://boundless.my.id/`.
- SEO & Open Graph Preview: meta `og:image`, `og:url`, `og:title`, `og:description`, `twitter:card` summary_large_image, canonical link ke `https://invite.boundless.my.id/ruhaeni-roni`.
- Kompresi Foto: 15 foto dioptimasi (max 1600px, quality 82%, interlaced), ukuran total turun dari ~28 MB ke ~4.3 MB (hemat 85% bandwidth).

## Blocker / Catatan
- **String koneksi Neon sempat terekspos di chat** — disarankan Reset password di dashboard Neon setelah deploy (`.env` lokal sudah aman di-gitignore).
- Deploy Vercel + set env `DATABASE_URL` belum dilakukan (menunggu push GitHub).
- **Foto asli sudah terpasang** (Sep 2026): 15 foto di-rename ke nama template — hero, bride, groom, gallery-1..12. Bride/groom sudah dikonfirmasi via file `pria.jpg`/`wanita.jpg` dari user.
- **Musik latar aktif**: `/audio/wedding.mp3` offline (Christina Perri — A Thousand Years), mulai detik ke-5 (`wedding.ts:music`).
- **Batik**: `static/batik/batik-semen.png` 600×600 PNG tunggal, `BatikTexture` cover no-repeat 440px 0.16, dark via invert.

## Langkah Berikutnya
1. ✅ Push commit awal ke GitHub — commit `d6a2938` di `main` (repo: syamsulsariphidayat7/invite)
2. Import repo di Vercel, set `DATABASE_URL` (pooled), deploy
3. Set custom domain di Vercel: `invite.boundless.my.id`
4. ✅ Ganti foto placeholder dengan foto asli — 15 foto terpasang (hero, bride, groom, galeri 12)
5. ✅ Musik latar — A Thousand Years (offline mp3)
6. ✅ Polish & cleanup — done 2026-09-06
7. ✅ Data produksi rekening DANA & IG
8. ✅ Slug routing `/[slug]` (`/ruhaeni-roni`)
