# SIMANTAB — alamat Workers.dev singkat tanpa mengganggu aplikasi lama

**Alamat yang disiapkan (BELUM live):**
`https://simantab.m-arief-rohman.workers.dev/`

**Alamat berjalan yang tetap dipertahankan:**
`https://simantab-cf-preview.m-arief-rohman.workers.dev/`

Status: konfigurasi telah disiapkan, tetapi deploy Worker `simantab`, ketersediaan nama, dan pengujian runtime Cloudflare harus dikonfirmasi.

## A. Pembedaan dua Worker

| Komponen | Worker lama | Worker baru |
|---|---|---|
| Nama | `simantab-cf-preview` | `simantab` |
| Config | `web/wrangler.jsonc` | `web/wrangler.short.jsonc` |
| Build | `npm run build:cloudflare` | `npm run build:cloudflare-short` |
| Domain | `simantab-cf-preview.m-arief-rohman.workers.dev` | `simantab.m-arief-rohman.workers.dev` |
| Backend | Supabase yang sama | Supabase yang sama |
| Modifikasi DNS eksternal | Tidak | Tidak |
| Domain resmi `batangkab.go.id` | Tidak diubah | Tidak diubah |

**Penting:** Hanya Worker bernama `simantab` yang boleh menerima deploy untuk alamat pendek. Periksa di Cloudflare → Workers & Pages bahwa nama `simantab` belum digunakan oleh layanan lain. Jika sudah digunakan, **jangan menimpanya**.

## B. Cara menerbitkan (admin Cloudflare dengan Wrangler)

Dari checkout repo yang berisi branch `migration/cloudflare-pages-simantab-20261013` dan direktori proyek `web`:

```sh
cd web
npm ci
npx wrangler whoami
npm run build:cloudflare-short
npx wrangler deploy --config wrangler.short.jsonc
```

Catatan:
- Jalankan setelah memastikan `wrangler whoami` menunjukkan akun Cloudflare yang memiliki subdomain `m-arief-rohman.workers.dev` dan bahwa Worker `simantab` belum ada/tidak dipakai.
- Jangan kirim Cloudflare API token/password melalui chat, kode frontend, atau GitHub.
- Perintah deploy **hanya menerbitkan Worker baru bernama `simantab`**, tidak mengubah nama Worker lama pada `wrangler.jsonc`.
- Gunakan `npm run build:cloudflare-short` agar canonical, OG, dan gambar pratinjau memakai alamat pendek. Build standar tetap memakai alamat lama.
- Bila menggunakan pipeline deploy otomatis Cloudflare, tambahkan **proyek/konfigurasi Worker kedua** yang membaca `web/wrangler.short.jsonc`; jangan menukar konfigurasi Worker lama.
- Ketersediaan nama Worker baru baru bisa dipastikan melalui akun Cloudflare.

## C. Pengujian setelah Worker baru berhasil diterbitkan

1. Buka `https://simantab.m-arief-rohman.workers.dev/` → login publik dan pilihan **Pasang Aplikasi SIMANTAB** terlihat.
2. Uji `/install.html`, `/manifest.json`, `/sw.js`, `/offline.html`, `/og-simantab-login.png`, dan `/panduan-instal.html`; semuanya harus termuat melalui HTTPS.
3. Cek halaman `view-source`: canonical dan `og:url` memakai `https://simantab.m-arief-rohman.workers.dev/`, OG image memakai host yang sama.
4. Di Chrome → Application → Service Workers: aman, hanya cache halaman offline publik, dan tidak menyimpan HTML akun/API/berkas GTK. PWA pada alamat pendek merupakan instalasi **origin berbeda** dari PWA alamat lama.
5. Supabase Dashboard → Authentication → URL Configuration → **Redirect URLs**: tambahkan `https://simantab.m-arief-rohman.workers.dev/`. Jika diperlukan alur redirect spesifik, tambahkan pola yang paling sempit sesuai callback aplikasi. Pertahankan alamat lama. **Jangan ubah Site URL default** sebelum pengujian lupa password/konfirmasi email pada hostname baru berhasil.
6. Login dan logout sebagai akun uji Dinas/GTK/Korwil/Pengawas. Uji lupa password, PWA, layanan baca, dan Cuti/KGB/KP/Jabfung/Diklat tanpa mengubah usulan riil. Uji pembatasan RLS sesuai akun.
7. Pastikan Worker lama tetap mengembalikan aplikasi dan menerima trafik, sementara Worker baru telah diuji. Bagikan alamat pendek/QR baru **hanya setelah QA**.
8. Jika gagal, hentikan distribusi alamat pendek dan gunakan URL lama. Tidak perlu rollback Supabase ataupun menghapus data akun.

## D. Risiko dan cakupan

- Membuat Worker tambahan di **akun Cloudflare yang sama** menggunakan subdomain `workers.dev`, tanpa membeli domain/menyetel DNS Pemkab. Pemakaian Worker dan build dapat tetap mengikuti batas paket akun Cloudflare.
- Tautan autentikasi berbasis email dapat kembali ke alamat lama sampai Redirect URLs dan default Site URL disesuaikan.
- Service worker, local storage, cookie, PWA, dan sesi browser terikat origin; sebagian pengguna mungkin perlu login dan memasang ulang aplikasi di alamat pendek.
- SIMANTAB masih menggunakan Supabase sebagai sumber data; 7.008 GTK dan data Diklat KS 120 peserta aktif tidak perlu dimigrasikan.
- Penerapan langsung di dashboard Cloudflare memerlukan koneksi/akses administrator. **GitHub merge bukan bukti Worker baru sudah dibuat ataupun alamatnya sudah online.**

**Status tugas ini: siapkan berkas dan audit, bukan deploy otomatis.**
