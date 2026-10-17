# SIMANTAB-ONLINE Cloudflare PWA v8

**Domain resmi tujuan (belum aktif):** `https://simantab.disdikbud.batangkab.go.id/`.
Domain Worker `workers.dev` di bawah ini tetap digunakan selama validasi DNS, HTTPS, dan redirect Supabase.
Untuk prosedur cutover, lihat [Persiapan Domain Resmi](../../docs/DOMAIN_SIMANTAB_DISDIKBUD_BATANGKAB_GO_ID.md).

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
`npm run build:cloudflare` → build dari snapshot HTML dalam repositori → `cloudflare/postbuild.mjs` → `harden-gtk-submission.mjs` → `enable-pwa.mjs` (SW aman) → `build-social-login-preview.mjs` → `verify-deployment-bundle.mjs` (gagal build apabila login/PWA/perlindungan cache tidak lengkap).

## Pengujian sebelum mengumumkan ke GTK
1. Deploy commit cabang Cloudflare sampai status **Ready**.
2. Buka root dan `/install.html` tanpa login. Periksa ikon, manifest, dan tombol panduan instalasi.
3. Di Chrome DevTools > Application > Service Workers: pastikan SW aman `sw.js?v=9` (isi kode SW v8) berstatus activated; Cache Storage hanya boleh memuat `/offline.html`.
4. Buka tanpa koneksi: tampil halaman offline generik tanpa data personal.
5. Kembalikan internet, uji login Dinas dan Sekolah/GTK/Pengawas, serta logout.
6. Uji Cuti/KGB operator di ruang QA, usul Jabfung, AI, dan file unggah tanpa membuat duplikat usulan produksi.
7. Pindai QR poster dan pastikan sampai ke halaman `/install.html`. Pengumuman hanya boleh menggunakan alamat yang sudah diuji.

## Batasan
Nama Worker masih memakai `cf-preview`. Pengumuman boleh memakai tautan ini setelah QA, tetapi jangan menyebutnya domain permanen jika kelak akan diganti.
**Build Cloudflare saat ini memakai HTML bootstrap yang tersimpan di repositori**, tidak mengambil HTML dasar dari Vercel. Pembaca AI Diklat KS dan Jabfung telah ditutup/dialihkan ke alur lokal gratis. Tetap jangan nonaktifkan Vercel sebelum QA fungsional seluruh layanan, domain resmi, reset password, dan prosedur pemulihan disetujui. Pemeriksaan otomatis di sini hanya membuktikan kelengkapan bundel, **bukan** pengujian browser produksi.
