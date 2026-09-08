# PANDUAN PENGGUNAAN — Undangan (invite.boundless.my.id)

Panduan lengkap untuk tiga peran: **Admin** (operator platform), **Konsumen** (pemilik undangan), dan **Tamu** (penerima undangan). Berlaku untuk kondisi aplikasi per 2026-09-08.

---

## 1. Ringkasan Aplikasi

Platform undangan pernikahan digital multi-undangan (SaaS). Satu kode, banyak undangan — setiap undangan punya **slug** sendiri (`invite.boundless.my.id/{slug}`), kontennya tersimpan di database (`invitations.data_json`), dan bisa dikelola lewat panel admin.

| Peran | Akses | URL |
|---|---|---|
| Tamu | Publik | `invite.boundless.my.id/{slug}` |
| Konsumen (kelola tamu) | PIN 6-digit per undangan | `invite.boundless.my.id/{slug}/kelola` |
| Admin (operator platform) | `ADMIN_PIN` | `invite.boundless.my.id/admin` |

**Template/layout tersedia**: `classic` (abu-botani, batik) & `rose` (burgundy-emas) — dipilih per undangan via kolom `template`; `noir` & `botanical` menyusul. Pratinjau layout lain tanpa mengubah undangan: buka `invite.boundless.my.id/{slug}?template=rose`.

**Undangan contoh aktif:** `invite.boundless.my.id/ruhaeni-roni`

---

## 2. Untuk Admin (Operator Platform)

Login di `/admin` menggunakan PIN dari env `ADMIN_PIN` (httpOnly cookie, otomatis logout 7 hari). Rate limit login: 5 percobaan / 15 menit.

### 2.1 Daftar Undangan (Overview)
Tabel semua undangan: subdomain, pasangan, tanggal, status (draft/active/expired), PIN kelola. Aksi per baris:
- **Lihat** — buka undangan di tab baru
- **Kelola** — halaman kelola tamu konsumen (PIN otomatis diisi)
- **Salin Link** — copy URL undangan
- **Edit** — ubah subdomain/status/PIN (form)
- **Hapus** — hapus undangan + tamu & ucapan terkait (CASCADE)

### 2.2 Membuat Undangan Baru
Tombol **Buat Undangan Baru** → isi:
- **Subdomain** (wajib, 3–63 karakter, huruf kecil/angka/strip; kata terlarang ditolak)
- **Pihak 1 & 2**, **Tanggal Acara**, **Status** (draft = belum bisa dibuka tamu)
- **Template / Layout** (classic / rose) — bisa diubah kapan pun via Edit
- **PIN Kelola Tamu** (6 digit; kosong = tanpa PIN, dev pakai `000000`)

Setelah dibuat, isi kontennya di tab **Konten** (2.5). Status baru = `draft` → ubah ke `active` saat undangan siap disebar.

### 2.3 Tab Ringkasan
Statistik tamu & ucapan + **Export**: pilih jenis (Tamu/Ucapan) → tombol **CSV**, **Excel**, atau **PDF**.

### 2.4 Tab Foto (Storage)
Satu pintu upload ke Supabase Storage bucket `invitation-photos/{slug}/` — otomatis dikompresi **sharp** (1600px, JPEG q82):
- **Pilih Foto** (max 12 file/upload) → pratinjau → **Simpan N foto** — semua foto masuk **galeri** (muncul di section Galeri undangan)
- Setiap foto galeri bisa dijadikan **Hero / Bride / Groom / Sampul** (boleh rangkap) lewat tombol peran di bawah foto; **badge di pojok foto** menandai peran yang sedang dipakai — foto tanpa peran berbadge **Galeri**
- Aksi: **↑↓** reorder galeri, **hapus** per foto, centang untuk **hapus massal**

### 2.5 Tab Konten (Isi Undangan)
Semua field mengisi `data_json`; kosong = pakai nilai default dari `wedding.ts`. Section:
- **Events** — daftar acara (nama, tanggal, jam, lokasi, maps URL). 1 event = Resepsi; ≥2 = Akad + Resepsi (countdown mengikuti)
- **Gifts** — rekening amplop digital (type bank/ewallet, provider, pemilik, nomor)
- **Amplop Digital** — catatan teks gift (opsional)
- **Mempelai** — nama, full name, relation, IG, WA (bride & groom)
- **Lokasi** — nama venue, alamat, maps URL (menang atas turunan dari events)
- **Ayat** — toggle tampil/sembunyi + arab, terjemahan, sumber
- **Love Story** — intro + bab (judul & teks), tambah/hapus dinamis
- **Sosial & Ucapan** — WA/IG footer, min. karakter nama & pesan, catatan ucapan (foto cover sampul diatur di tab Foto → peran Sampul)
- **Tema & Media** — warna primary/secondary (override palet), Music URL, YouTube ID fallback, mulai detik ke-, Livestream URL

Simpan → **Simpan Konten** (menimpa `data_json`; preview langsung di `/{slug}`).

### 2.6 Tab Ucapan
Daftar ucapan per undangan + tombol **Hapus** (moderasi). Ucapan terbaru di atas.

---

## 3. Untuk Konsumen (Pemilik Undangan)

Buka `invite.boundless.my.id/{slug}/kelola` → masukkan **PIN** (dari admin; dev `000000`). Semua data tersinkron database (lintas device).

### 3.1 Daftar Tamu
- **Tambah satu** — input nama → Enter
- **Tambah banyak** — paste daftar (satu nama per baris) → bulk add
- **Cari** & **filter** (Semua / Belum Dikirim / Sudah Terkirim)
- Status terkirim: klik lingkaran di kiri nama (tandai manual atau otomatis saat kirim WA)

### 3.2 Kirim Undangan via WhatsApp
Per tamu: tombol **WA** → buka chat dengan pesan template (auto tandai terkirim). **Bulk**: centang beberapa nama → **Salin Link** (massal) atau **Kirim WA** (buka berurutan) + **Tandai terkirim**.

Template pesan default: `Halo {nama}, kamu diundang... {link} ...` — bisa diubah lewat **Ubah Format Pesan WhatsApp** (variabel `{nama}` & `{link}`) atau reset ke default.

---

## 4. Untuk Tamu

1. Buka link undangan (dengan `?to=Nama` kalau dikirim konsumen → sampul menyapa nama)
2. Klik **Buka Undangan** — musik mulai, konten muncul dengan animasi
3. Isi **Ucapan & Doa**: nama, kehadiran (Hadir/Tidak), jumlah orang (1–10), pesan, **captcha Turnstile** → Kirim
4. Navigasi: nav bawah (Home/Couple/Event/Gallery/Gift/Wishes), countdown sticky, scroll progress
5. Musik: tombol bulat kanan-bawah (jeda/putar); galeri bisa di-zoom (lightbox + keyboard panah)

---

## 5. Environment Variables

| Variabel | Wajib? | Fungsi |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres Supabase (pooler 6543). Parser custom tahan password berkarakter spesial |
| `ADMIN_PIN` | ✅ (untuk /admin) | PIN login admin (httpOnly cookie) |
| `SUPABASE_URL` | saat upload foto | URL project Supabase (`https://<ref>.supabase.co`) |
| `SUPABASE_SECRET_KEY` | saat upload foto | Service key (server-only, **jangan** pernah ke client) |
| `TURNSTILE_SITE_KEY` | opsional | Captcha form ucapan (publik) |
| `TURNSTILE_SECRET_KEY` | opsional | Verifikasi token captcha (server-only) |
| `NEON_DATABASE_URL` | saat migrasi | Sumber migrasi Neon→Supabase (script `scripts/migrate-to-supabase.mjs`) |

`.env` lokal di-gitignore; salinan referensi di `.env.example`. Jangan pernah paste secret di chat/publik.

---

## 6. Deploy & Domain

- Push ke `main` → Vercel auto-deploy (adapter Node 24, dikonfigurasi di `vite.config.ts` — tidak ada `svelte.config.js`)
- Domain: `invite.boundless.my.id` (custom domain di Vercel)
- Cron Vercel: `/api/health` setiap 06:00 (keep-warm)

---

## 7. Struktur Data & Konten Default

- Konten default: `src/lib/data/wedding.ts` (dipakai bila `data_json` kosong)
- Kontrak `data_json`: lihat `ARCHITECTURE.md` §5 (theme, couple, photos, gallery, verse, events, gifts, gift_note, love_story, venue, social, wishes, music, livestream_url)
- `resolve.ts` menggabungkan default + override → komponen (`ARCHITECTURE.md` §6)
- Foto: `/static/photos/{base}.jpg` (Photo mencoba .jpg→.jpeg→.png→.webp→placeholder)

---

## 8. Troubleshooting Cepat

| Gejala | Penyebab → Solusi |
|---|---|
| Ucapan selalu 0 / in-memory | `DATABASE_URL` salah/tidak terbaca → cek env Vercel & `.env`, redeploy; tes `node scripts/check-db.mjs` |
| Captcha muncul terus-menerus | `TURNSTILE_*` terisi tapi widget gagal → cek hostname widget di Cloudflare Turnstile = `invite.boundless.my.id` |
| Foto tidak muncul | File asli hilang → cek `/static/photos/` atau upload ulang via admin (tab Foto) |
| Halaman 404 padahal undangan ada | Status masih `draft` → ubah ke `active` di admin |
| Login admin gagal | PIN salah / `ADMIN_PIN` belum diset / kena rate limit 5×15 mnt |
| Undangan tidak bisa dibuka setelah diedit | Cek tab Konten tersimpan (`data_json` valid); preview `?preview=1` |