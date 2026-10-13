# SIMANTAB — Cloudflare Workers Static Assets (jalur alternatif resmi 2026)

Cloudflare kini mengutamakan Workers untuk aplikasi baru. File ini menyiapkan tampilan SIMANTAB di **Workers** dengan **aset statis**, menggunakan repositori GitHub yang sama dan **tidak** mengubah situs Vercel atau database Supabase.

## Langkah di dashboard

1. Buka **dash.cloudflare.com** (BUKAN `developers.cloudflare.com` — itu dokumentasi).
2. Workers & Pages → Create application → Continue with GitHub.
3. Repositori: `ariefupgriss3-eng/Simantab-online`.
4. **Production branch untuk proyek preview ini**: `migration/cloudflare-pages-simantab-20261013` (bukan `main`). Jika Cloudflare membuat proyek dulu dengan branch default `main`, ubah di Settings → Builds → Branch control sebelum deployment aktif.
5. Project/Worker name: `simantab-cf-preview` (jika belum dipakai).
6. Root directory: `web`.
7. Build command: `npm run build:cloudflare`.
8. Deploy command: `npx wrangler@4 deploy`.
9. Wrangler config dari cabang ini: `web/wrangler.jsonc`, berisi `assets.directory = "./.vercel/output/static"`.
10. Jangan buat custom domain dahulu. Jangan klik deploy sebelum memeriksa field pada halaman bersama pendamping.

## Yang tersedia dan yang belum

- Tampilan web, modul Pengawas v4, PWA, aset statis berasal dari output build yang disiapkan cabang migrasi.
- Supabase Auth, PostgreSQL, Storage, RLS, dan Edge Functions tetap menggunakan proyek produksi yang sama.
- Dua endpoint Vercel untuk AI reader (`/api/diklat-ai-read`, `/api/jabfung-ai-read`) **belum dimigrasikan**. Worker static assets ini **bukan** pengganti backend AI. Jangan uji atau jalankan proses AI nyata melalui preview.
- Kebijakan upload 1,5 MiB dan variasi batas berkas Diklat KS memerlukan pemeriksaan terpisah.
- Menghubungkan repo dan deploy Cloudflare mungkin menimbulkan penggunaan kuota platform, tetapi **tidak ada upgrade paket berbayar** yang disetujui.

## Gate sebelum pengalihan produksi

- Hasil build berhasil dan semua modul JS termuat.
- Login Pengawas/Korwil dan katalog kepegawaian sesuai hak akses.
- Semua fungsi API, webhook, tautan reset password, Supabase Auth redirect URLs, dan service worker diuji pada domain preview.
- Pindahkan API AI ke Cloudflare Functions/Workers atau Supabase Edge Functions; lepaskan ketergantungan Vercel secara tuntas.
- Gunakan domain sendiri untuk produksi, jangan mencoba memindahkan subdomain `vercel.app`.

Referensi resmi:
https://developers.cloudflare.com/workers/get-started/dashboard/
https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
https://developers.cloudflare.com/workers/static-assets/
