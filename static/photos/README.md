# Folder Foto

Taruh foto asli di folder ini dengan **nama dasar** yang sama dengan placeholder.
Ekstensi yang otomatis dicoba: `.jpg` → `.jpeg` → `.png` → `.webp` → placeholder `.svg`.

| Nama file      | Dipakai untuk                       |
| -------------- | ----------------------------------- |
| `hero.jpg`     | Latar layar pembuka (hero) & sampul |
| `bride.jpg`    | Foto mempelai wanita                |
| `groom.jpg`    | Foto mempelai pria                  |
| `gallery-1.jpg` s/d `gallery-8.jpg` | Galeri foto |

Tips:

- **Hero**: foto potret pasangan, resolusi tinggi (mis. 1080×1440).
- **Bride/Groom**: potret 4:5.
- **Gallery**: bujur sangkar 1:1.
- Anda juga bisa mengubah jumlah galeri / nama file di `src/lib/data/wedding.ts` (bagian `photos`).
- Placeholder SVG berada di `static/photos/placeholders/` — hapus file yang sudah tidak terpakai.
