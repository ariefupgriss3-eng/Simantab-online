# SIMANTAB-ONLINE Cloudflare PWA v8

Target aplikasi: `https://simantab-cf-preview.m-arief-rohman.workers.dev/`

Tautan pemasangan dan tujuan QR resmi:
`https://simantab-cf-preview.m-arief-rohman.workers.dev/install.html`

## Cara pasang
- Android Chrome: pindai QR, buka di Chrome, pilih tombol instalasi atau menu ⋮ → Instal aplikasi/Tambahkan ke layar utama.
- iPhone/iPad Safari: Bagikan → Tambahkan ke Layar Utama.
- Windows/macOS Chrome atau Edge: gunakan ikon instalasi di address bar atau menu → Instal aplikasi.
- Setelah terpasang, buka ikon SIMANTAB di layar utama; pengguna tetap wajib login. Tidak ada penguncian atau otomatisasi ulang sesi pengguna.

## Keamanan data
Service worker **hanya** menyimpan halaman publik `offline.html`, bukan HTML autentikasi, jawaban, profil, API, file PDF, data GTK, atau berkas unggahan.
- Navigasi memerlukan koneksi jaringan dan selalu `cache: no-store`.
- Ketika offline, pengguna menerima halaman informasi koneksi terputus; tidak disediakan fitur kerja offline.
- Mutasi POST, token Supabase, permintaan API, dan domain lain sama sekali tidak diintersep.
- Pembaruan worker menghapus cache SIMANTAB lama tanpa menyentuh cache domain lain.
- Cloudflare Workers menyajikan `sw.js`, `pwa-install.js`, `manifest.json`, `offline.html` dan `install.html` dari Assets.

## Pipeline
`npm run build:cloudflare` → build semula → `cloudflare/postbuild.mjs` (semua QA operator/Korwil) → `cloudflare/enable-pwa.mjs` (menghapus opt-out PWA Cloudflare dan memasang SW aman).

## Pengujian sebelum mengumumkan ke GTK
1. Deploy commit cabang Cloudflare sampai status **Ready**.
2. Buka root dan `/install.html` tanpa login. Periksa ikon, manifest, dan tombol panduan instalasi.
3. Di Chrome DevTools > Application > Service Workers: pastikan SW `sw.js?v=8` berstatus activated; Cache Storage hanya boleh memuat `/offline.html`.
4. Buka tanpa koneksi: tampil halaman offline generik tanpa data personal.
5. Kembalikan internet, uji login Dinas dan Sekolah/GTK/Pengawas, serta logout.
6. Uji Cuti/KGB operator di ruang QA, usul Jabfung, AI, dan file unggah tanpa membuat duplikat usulan produksi.
7. Pindai QR poster dan pastikan sampai ke halaman `/install.html`. Pengumuman hanya boleh menggunakan alamat yang sudah diuji.

## Batasan
Nama Worker masih memakai `cf-preview`. Pengumuman boleh memakai tautan ini setelah QA, tetapi jangan menyebutnya domain permanen jika kelak akan diganti.
Build legacy masih mengambil HTML dasar dari Vercel, dan AI tertentu memakai Vercel Gateway. Jangan matikan Vercel sebelum audit independensi build dan migrasi AI selesai.
