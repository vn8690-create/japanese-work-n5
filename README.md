# Nihongo Kerja N5

Aplikasi web ringan untuk pengguna Indonesia yang baru belajar bahasa Jepang, terutama untuk persiapan kerja di Jepang dan JLPT N5-N4.

## Fitur

- UI Bahasa Indonesia
- Mobile-first dan cepat untuk ponsel low-end
- Modul Kosakata, Kanji, Tata Bahasa, Percakapan, Latihan Soal, Flashcard, dan Progress
- Data konten dipisah ke file JSON
- Data JSON dimuat hanya saat modul dibuka
- Tes cepat 10 soal dan tes normal 40 soal
- Rutinitas harian 7 menit dengan streak
- Flashcard SRS dengan pilihan Sulit, Lumayan, dan Mudah
- Review khusus untuk jawaban salah
- Kartu hasil tes yang rapi untuk screenshot Facebook/TikTok
- Mode Screenshot untuk menyembunyikan navigasi saat mengambil tangkapan layar
- Skenario kerja: pabrik, kaigo, restoran, konbini, konstruksi
- Tombol dengar pelafalan Jepang memakai Web Speech API jika didukung browser
- Soal reading dimuat berdasarkan passage
- Pencarian kosakata
- Dark mode
- Progress tersimpan di localStorage
- PWA sederhana dengan manifest dan service worker
- Siap deploy ke GitHub Pages
- Konten diperluas: 120 kosakata, 80 kanji, 50 grammar, 25 dialog, 10 skenario, 100 soal, dan 10 reading passage

## Struktur

```text
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   └── icon.svg
├── src/
│   ├── app.js
│   ├── flashcards.js
│   ├── quiz-engine.js
│   └── styles.css
└── data/
    ├── vocabulary-n5.json
    ├── kanji-n5.json
    ├── grammar-n5.json
    ├── conversations-work-n5.json
    ├── scenarios-work-n5.json
    └── questions/
        ├── kosakata-n5.json
        ├── kanji-n5.json
        ├── bunpou-n5.json
        └── reading-n5.json
```

## Menjalankan Lokal

Karena app memakai `fetch()` untuk JSON, jalankan dengan server lokal.

```bash
npx serve .
```

Atau pakai server apa pun, misalnya:

```bash
python -m http.server 5173
```

Lalu buka:

```text
http://localhost:5173
```

## Deploy ke GitHub Pages

1. Buat repository GitHub.
2. Upload semua file di folder ini ke root repository, atau ke folder `docs`.
3. Buka `Settings` → `Pages`.
4. Pilih source:
   - `Deploy from a branch`
   - branch `main`
   - folder `/root` jika file ada di root, atau `/docs` jika memakai folder docs.
5. Simpan, lalu tunggu URL GitHub Pages aktif.

## Menambah Konten

- Tambah kosakata di `data/vocabulary-n5.json`.
- Tambah kanji di `data/kanji-n5.json`.
- Tambah grammar di `data/grammar-n5.json`.
- Tambah dialog kerja di `data/conversations-work-n5.json`.
- Tambah skenario kerja di `data/scenarios-work-n5.json`.
- Tambah soal di `data/questions/`.

Pastikan format JSON tetap valid. App tidak memuat semua JSON saat startup, jadi ukuran konten bisa bertambah secara bertahap tanpa memperlambat halaman awal.

## Catatan Performa

- Tidak memakai framework besar.
- Tidak memakai gambar/audio berat.
- Service worker menyimpan app shell dan data yang pernah dibuka.
- Quiz dan flashcard memakai native ES module dynamic import, jadi kode khusus fitur tersebut dimuat saat dibutuhkan.
- Konten dipaginasi 10 item per halaman.
- Flashcard dan test mode baru memuat data saat digunakan.
