# SIMANTAB-ONLINE — persiapan Cloudflare Pages

> **Cabang migrasi saja, belum produksi.** Tautan SIMANTAB Vercel, data Supabase, akun GTK, izin Korwil/Pengawas SMP, proses KP/Jabfung, dan arsip Diklat KS tidak diubah.

## 1. Target yang sudah disiapkan

- Hosting web dan PWA: Cloudflare Pages.
- Database, Auth, Storage, RLS, dan Supabase Edge Functions tetap pada proyek Supabase **yang sama**.
- Build terpisah dari Vercel: `secure-build.mjs` menggunakan `cloudflare/bootstrap-production-20261013.html` saat `SIMANTAB_BUILD_TARGET=cloudflare`.
- Pemeriksaan hasil build, file statis, header HTTP keamanan, dan modul Pengawas v4: `cloudflare/postbuild.mjs`.
- Cabang: `migration/cloudflare-pages-simantab-20261013`; jangan gabung ke `main` sebelum uji.

## 2. Membuat proyek Cloudflare Pages

Dalam Cloudflare Dashboard, pilih **Workers & Pages > Create application > Pages > Connect to Git**. Hubungkan akun GitHub yang memiliki akses ke repositori `ariefupgriss3-eng/Simantab-online`. Pilih repo tersebut dan isi:

| Pengaturan | Nilai |
| --- | --- |
| Framework preset | None / No framework |
| Production branch Cloudflare | `migration/cloudflare-pages-simantab-20261013` |
| Root directory | `web` |
| Build command | `npm run build:cloudflare` |
| Build output directory | `.vercel/output/static` |
| Project name | Nama preview unik, misalnya `simantab-cf-preview` |
| Node.js | Gunakan versi Node.js yang disediakan lingkungan build; lihat log jika ada masalah |

**Catatan:** Folder output masih bernama `.vercel/output/static` demi kompatibilitas skrip lama. Folder tersebut hanya berisi aset statis yang bisa dilayani Cloudflare Pages; nama folder bukan berarti Cloudflare membutuhkan akun Vercel.

Cloudflare akan membuat tautan `<project>.pages.dev` yang terpisah dari situs lama. **Jangan mengalihkan domain atau menyebarkan tautan tersebut kepada pengguna sebelum proses QA selesai.**

## 3. Urutan pemeriksaan setelah klik Save and Deploy

1. Pastikan log build menunjukkan `cloudflareStaticBuild: "prepared"`, dan tidak ada error `anchor`, `marker`, `missing module`, atau `npm ci`.
2. Pastikan halaman login dapat dimuat serta ikon, stylesheet, JS, dan service worker tersedia.
3. Siapkan penambahan URL Cloudflare ke pengaturan **Supabase Auth > URL Configuration > Redirect URLs** jika alur email/reset password membutuhkan redirect ke origin baru. Jangan mengubah Site URL utama sebelum cutover.
4. Uji semua role memakai akun aman/terotorisasi tanpa mengubah data riil. Pengawas biasa harus melihat 12 menu; Korwil dan Pengawas SMP berizin mendapat satu menu tambahan Disiplin & Perceraian.
5. Periksa katalog Layanan Kepegawaian Pengawas, formulir KP/Jabfung, unggah sampai 1,5 MiB sesuai kebijakan setiap layanan, kebutuhan GTK riil, TPG/Tamsil, dokumen dan notifikasi.
6. Verifikasi alur login, reset password, status persetujuan akun, batas akses API langsung, RLS, dan file Supabase Storage.
7. **Jangan menyatakan migrasi selesai** sebelum layanan AI di tahap berikutnya berfungsi.

## 4. Pekerjaan yang masih wajib sebelum cutover

- **Endpoint AI pembaca berkas**: proyek sebelumnya menyediakan API Vercel `/api/diklat-ai-read` dan `/api/jabfung-ai-read` dari berkas `diklat-ai-read-edge.js` dan `jabfung-ai-read-edge.js`. Cloudflare Pages tidak memindahkan Vercel Edge Functions otomatis. Buat Cloudflare Pages Functions atau Supabase Edge Functions yang kompatibel, dengan autentikasi dan pembatasan biaya yang setara.
- **Provider AI**: API pembaca berkas masih menggunakan `ai-gateway.vercel.sh`; ketergantungan dan kunci API harus diputuskan sebelum migrasi penuh. Jangan menaruh kunci rahasia di JavaScript atau GitHub.
- **Berkas Diklat KS**: selaraskan batas berkas administrasi dan pemeriksaan AI dengan kebijakan 1,5 MiB agar tidak terjadi ketidaksesuaian.
- **Audit domain**: alamat `*.vercel.app` tidak dapat dipindahkan. Untuk URL resmi SIMANTAB gunakan domain milik sendiri, atau `*.pages.dev` selama tahap transisi.
- **PWA**: cache service worker, manifest, start_url, dan shortcut harus diverifikasi pada domain baru sebelum cutover.

## 5. Cara membatalkan persiapan

Tidak ada rollback database atau DNS yang diperlukan: cabang ini **tidak mengubah produksi**. Apabila build Cloudflare gagal, pertahankan situs lama, perbaiki kode hanya di cabang migrasi, lalu ulangi deploy preview.

## 6. Referensi resmi

- https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/bindings/

## Status pemeriksaan

- [x] Cabang terpisah dari `main`
- [x] Snapshot frontend publik di GitHub
- [x] Build dengan target `cloudflare` tanpa membaca homepage Vercel
- [x] Sinkronisasi marker/menu Pengawas v4 pada build
- [x] Pemeriksaan output statis dan header keamanan
- [ ] Cloudflare Pages terhubung ke GitHub
- [ ] Build cloud berjalan sukses
- [ ] URL preview aktif
- [ ] Migrasi 2 API pembaca dokumen AI
- [ ] Uji end-to-end seluruh role dan fungsional
- [ ] Pengalihan alamat publik resmi
