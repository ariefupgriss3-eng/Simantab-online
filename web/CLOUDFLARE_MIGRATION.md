# Migrasi SIMANTAB-ONLINE ke Cloudflare Pages (staging)

**Status: staging-ready source, belum terhubung ke akun Cloudflare, belum diuji di Pages, dan belum cutover.**

## Arsitektur
- UI, PWA, JS statis: **Cloudflare Pages**.
- API `/api/jabfung-ai-read`, `/api/diklat-ai-read`, `/api/bcks-thinking`: **Cloudflare Pages Functions** pada `web/functions/api/`.
- Database, login Supabase Auth, unggah file Supabase Storage, fungsi `simantab-jabfung-ai-workflow`: **Supabase yang sama**, tidak dipindahkan.
- Endpoint AI yang masih memakai `https://ai-gateway.vercel.sh` tetap bergantung pada **Vercel AI Gateway**. Migrasi hosting **belum** berarti memigrasikan penyedia AI. Evaluasi biayanya sebelum menyiapkan secret API.

## Deploy awal ke Pages tanpa menyentuh Vercel
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Hubungkan GitHub `ariefupgriss3-eng/Simantab-online`. Jika perlu, izinkan repo tersebut melalui aplikasi GitHub Cloudflare.
3. Buat proyek baru bernama `simantab-online` (atau nama lain yang tersedia), pilih **cabang staging** `migration/cloudflare-pages-simantab-20261014` sebagai production branch **untuk proyek Cloudflare baru**, bukan mengubah Vercel.
4. Root directory `web`; build command `npm run build:cloudflare`; output `.vercel/output/static`; Node.js 22+; compatibility date `2026-10-14`.
5. Tambah **secret** `AI_GATEWAY_API_KEY` melalui Variables and Secrets pada Pages bila fitur AI Vercel Gateway harus aktif. Jangan memasukkan token ke repo, chat, atau berkas statis.
6. Deploy ke domain sementara `*.pages.dev`. Jangan arahkan domain produksi sebelum uji.
7. Tambahkan alamat Pages ke **Supabase Auth → URL Configuration → Redirect URLs** yang resmi, tanpa menghapus URL Vercel.
8. Uji login/logout/reset password, GTK/KS/korwil/pengawas/operator SMP, KGB/cuti, Jabfung (upload 1,5 MB), distribusi jenjang dan RLS, AI, PWA Android, dan tiga endpoint API. Uji transaksi dengan akun dan data uji yang diberi izin saja.
9. Jika seluruhnya lolos, lakukan cutover domain khusus dengan prosedur rollback yang jelas. **Jangan menonaktifkan Vercel sebelum domain Cloudflare dan login bekerja**.

## Catatan penting yang perlu diselesaikan sebelum berhenti memakai Vercel
Build historis di repo ini masih mengambil *HTML awal* dari `https://simantab-online.vercel.app/` melalui `web/secure-build.mjs`, lalu membentuk output baru. Ini merupakan **ketergantungan build** (bukan Cloudflare runtime). Jangan menghapus proyek Vercel sampai HTML dasar dari versi produksi terakhir berhasil ditangkap, diaudit, disimpan permanen sebagai sumber yang independen, dan diuji ulang. Arsip source-browser Oktober 2026 sebelumnya adalah salinan lama dan **tidak dipakai sebagai dasar tanpa verifikasi kesetaraan**.

`web/api/bcks-thinking.js` memakai CommonJS serta respons ala Node; adapter `web/functions/api/bcks-thinking.js` membutuhkan build dan smoke test di runtime Pages Workers sebelum dianggap siap. Versi Pages harus tidak menonaktifkan RLS dan tidak memakai service-role Supabase pada browser.

## Pemeriksaan rilis
- `node --test tests/jabfung-auth.test.cjs` dari direktori `web`.
- `npm run build:cloudflare` di lingkungan berinternet dan dependensi tersedia.
- Periksa `index.html`, `sw.js`, `manifest.json`, `supabase-local.js`, `_headers`, `_routes.json`, dan assets lain pada output build.
- Verify `GET /api/jabfung-ai-read` (metadata saja), `GET /api/diklat-ai-read`, `POST /api/bcks-thinking` tanpa token mengembalikan 401/400 (jangan panggil AI tanpa token).
- Rute `/api/*` harus ditangani Function Cloudflare, bukan index HTML.
- Lakukan cek ulang bahwa semua proses GTK yang ada pada Vercel benar-benar tersedia di Pages.

## Rollback
Pertahankan `https://simantab-online.vercel.app/` selama verifikasi. Bila Cloudflare mengalami masalah setelah cutover domain khusus, alihkan domain kembali ke origin yang sehat berdasarkan konfigurasi DNS/domain yang tercatat; data Supabase tidak diubah dan tidak perlu disalin.

Jangan mencoba mengambil kredensial pengguna, service-role, atau secret AI dari frontend/deployment. Konfigurasikan secara aman lewat Cloudflare dashboard saja.
