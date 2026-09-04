# PROGRESS.md — Undangan (Invite)

Terakhir diperbarui: 2026-09-04

## Fase Aktif
**Deployment** — tahap commit & push pertama ke GitHub (`git@github.com:syamsulsariphidayat7/invite.git`).

## Status Fase
| Fase | Status |
| ---- | ------ |
| Discovery & Design | ✅ Selesai (referensi: lovestory.web.id/amel-dendi; data Ruhaeni & Roni) |
| Setup (scaffold, deps, adapter Vercel) | ✅ Selesai |
| Development (konten, DB, komponen UI) | ✅ Selesai |
| Integration & Testing | ✅ Selesai (svelte-check 0 error, build OK, API Neon 201/400 OK, screenshot OK) |
| Deployment (Vercel + Neon) | 🔄 Berjalan — commit/push pertama; deploy Vercel menyusul |

## Sedang Dikerjakan
- Import repo di Vercel + set `DATABASE_URL` + deploy.

## Sudah Selesai
- Undangan lengkap: layar sampul + musik, hero, mempelai, ayat, countdown, akad & resepsi (20–21 Sep 2026), galeri, love story 3 bab, amplop digital, ucapan tamu → Neon, nav bawah, footer.
- Verifikasi penuh: `pnpm check` (0 error), `pnpm build` (exit 0), API `/api/wishes` tersimpan & terbaca di Neon, screenshot mobile & desktop.

## Blocker / Catatan
- **Foto asli belum dipasang** — masih placeholder SVG di `static/photos/placeholders/`; user punya foto, tinggal mengganti file sesuai `static/photos/README.md`.
- **String koneksi Neon sempat terekspos di chat** — disarankan Reset password di dashboard Neon setelah deploy (`.env` lokal sudah aman di-gitignore).
- Deploy Vercel + set env `DATABASE_URL` belum dilakukan (menunggu push GitHub).

## Langkah Berikutnya
1. ✅ Push commit awal ke GitHub — commit `d6a2938` di `main` (repo: syamsulsariphidayat7/invite)
2. Import repo di Vercel, set `DATABASE_URL` (pooled), deploy
3. Ganti foto placeholder dengan foto asli
4. (Opsional) Mulai fondasi multi-tema: tabel `weddings` + rute `/invitation/[slug]` + panel admin