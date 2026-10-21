# SIMANTAB — Peralihan Worker pendek (26 Oktober 2026)

**Alamat target:** `https://simantab.m-arief-rohman.workers.dev/`  
**Halaman PWA:** `https://simantab.m-arief-rohman.workers.dev/install.html`  
**Worker lama tetap ada:** `simantab-cf-preview`.

## Rancangan
Worker baru bernama `simantab` memakai aset frontend yang sama dan basis data Supabase yang sama; bukan mengubah nama Worker lama, tidak memigrasikan atau menghapus data, tidak menyentuh domain pemerintah. Hanya gunakan versi branch dengan QA hijau. File `web/wrangler.short.jsonc` memisahkan Worker pendek dari Worker preview.

1. Login ke akun Cloudflare dengan subdomain `m-arief-rohman.workers.dev`. Pastikan worker `simantab` belum dipakai app lain.
2. Dari branch yang telah disetujui, di folder `web/` jalankan `npm install --no-package-lock --ignore-scripts` lalu `npm run build:cloudflare-short`. Skrip sudah menyiapkan metadata canonical dan PWA untuk origin pendek.
3. Jalankan `npx wrangler deploy --config wrangler.short.jsonc` dari folder `web/` dengan akses Cloudflare yang sah. Nama target **harus** `simantab`, jangan deploy menggunakan `wrangler.jsonc` preview.
4. Uji HTTPS halaman utama, `/install.html`, `/manifest.json`, `/sw.js`; login Dinas/GTK; registrasi; persetujuan Super Admin; menu SMART-GTK; dan isolasi akses. Jangan uji dengan membuat akun NIP ganda atau berkas fiktif di produksi.
5. Tambahkan origin pendek hanya pada daftar origin Edge Function yang sebelumnya ketat, tanpa membuka wildcard. Cek `OPTIONS` dan `POST` tanpa melonggarkan JWT. Lihat status redirect Auth di Supabase jika aplikasi menggunakan OAuth/email return URL.
6. Setelah semua pemeriksaan lulus, **baru** terbitkan QR PWA, perbarui tautan surat edaran dan pemberitahuan. Pertahankan tautan lama selama masa transisi dan lakukan pemeriksaan harian sampai 26 Okt 2026 23.59 WIB.

## Rollback
Jika Worker pendek gagal, informasikan kembali alamat lama `https://simantab-cf-preview.m-arief-rohman.workers.dev/install.html`. Jangan menghapus database, akun, storage, migrasi atau Worker lama. Karena data Supabase sama, pengguna memakai akun yang sama; namun penyimpanan lokal/PWA seperti cache, sesi dan antrean unggah pada origin baru perlu diuji dan tidak berpindah otomatis.

**Belum berarti domain aktif:** file konfigurasi saja tidak mempublikasikan Worker. Peluncuran hanya dianggap selesai setelah `wrangler deploy` sukses dan uji end-to-end lewat HTTPS. Tidak perlu DNS manual untuk `workers.dev` jika sudah berada pada subdomain akun.
