# Domain resmi SIMANTAB: simantab.disdikbud.batangkab.go.id

**Status per 17 Oktober 2026: PERSIAPAN — DNS, sertifikat, dan konfigurasi Auth belum dialihkan.**
Disetujui sebagai alamat tujuan: `https://simantab.disdikbud.batangkab.go.id/`.

## A. Identitas teknis
| Komponen | Konfigurasi |
|---|---|
| Alamat resmi tujuan | `https://simantab.disdikbud.batangkab.go.id/` |
| Alamat operasional saat ini | `https://simantab-cf-preview.m-arief-rohman.workers.dev/` |
| Layanan Workers | `simantab-cf-preview` pada Cloudflare account yang sudah dipakai |
| Code branch | `migration/cloudflare-pages-simantab-20261013` |
| Database dan berkas | Supabase project yang sudah digunakan; tidak dipindahkan |
| PWA | `/manifest.json`, `/sw.js`, `/install.html`; hanya halaman offline publik yang di-cache |
| Origin build metadata | `SIMANTAB_PUBLIC_ORIGIN`, default **workers.dev** sampai cutover disetujui |

Domain `batangkab.go.id` adalah domain pemerintahan; **wajib persetujuan dan tindakan admin DNS/Diskominfo Pemkab**. Jangan menukar nameserver `batangkab.go.id` atau `disdikbud.batangkab.go.id` tanpa audit dampak aplikasi, email, dan subdomain pemerintah lain. Jangan membagikan password, secret, atau token melalui percakapan.

## B. Tanya kepada admin DNS/Diskominfo sebelum mengubah apa pun
1. Siapa pemegang otoritas DNS untuk `batangkab.go.id` dan `disdikbud.batangkab.go.id`? Sebutkan provider authoritative DNS, tanpa kredensial.
2. Apakah zona yang relevan **sudah aktif di Cloudflare**, dan apakah admin memberi izin menambahkan hostname sebagai Workers **Custom Domain**? Apakah zona dikelola oleh akun Cloudflare yang sama dengan Worker?
3. Apakah `simantab.disdikbud.batangkab.go.id` sudah memiliki A/AAAA/CNAME/TXT/CAA atau digunakan layanan lain? Jangan menimpa layanan yang telah ada.
4. Jika DNS Pemkab di luar Cloudflare: tetapkan solusi domain yang kompatibel dan biaya/izin (mis. skema **partial CNAME setup** yang mensyaratkan Cloudflare Business/Enterprise, atau rancangan domain yang divalidasi tim TI). **Jangan asal CNAME ke `*.workers.dev`.** Custom Domains Workers mensyaratkan zona Cloudflare aktif dan tidak bisa dipasang pada zona yang tidak dimiliki akun.
5. Pastikan sertifikat HTTPS dan validasi domain (DCV), aturan DNSSEC/CAA, serta kebijakan instansi untuk aplikasi dan data pegawai.

Rujukan Cloudflare:
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/dns/zone-setups/partial-setup/ (Business/Enterprise jika DNS authoritative di luar Cloudflare)
- https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/ (subdomain setup yang terpisah memiliki persyaratan Enterprise).

## C. Langkah petugas Cloudflare **setelah** kepemilikan DNS disahkan
1. Pada Cloudflare Workers & Pages → Worker `simantab-cf-preview` → Settings/Domains & Routes → Tambahkan **Custom Domain** `simantab.disdikbud.batangkab.go.id` pada zona aktif yang benar.
2. Laksanakan instruksi DNS/validasi yang **secara spesifik** diberikan dashboard; jangan mengarang target CNAME atau IP. Jangan memindahkan/mengubah nameserver domain Pemkab sendiri.
3. Tunggu status domain aktif dan sertifikat HTTPS valid. Periksa `https://simantab.disdikbud.batangkab.go.id/`, `/install.html`, `/manifest.json`, `/sw.js`, dan `/offline.html`. Periksa 200/redirect yang sesuai, tidak ada mixed content/SSL error.
4. Pertahankan hostname `workers.dev` aktif selama rollback dan pengujian.
5. **Baru setelah domain aktif**, atur build environment `SIMANTAB_PUBLIC_ORIGIN=https://simantab.disdikbud.batangkab.go.id` (tanpa `/` akhir), lalu rebuild Worker. Build akan mengganti `og:url`, `og:image`, dan canonical ke domain resmi; skrip pemeriksaan build menolak domain selain preview/tujuan yang disetujui. Pastikan deploy Ready dan 100% trafik.
6. Buka pratinjau tautan WhatsApp/FB dan cek gambar OG serta alamat yang dibuka adalah domain resmi.

**Jangan** menambahkan route `simantab.disdikbud.batangkab.go.id/*` atau `custom_domain` ke Wrangler sebelum zona diverifikasi. Domain publik tidak menjadi aktif hanya karena teksnya ada di kode.

## D. Supabase Auth URL Configuration
1. Dashboard Supabase (proyek SIMANTAB yang sudah ada) → Authentication → URL Configuration.
2. **Sebelum cutover**, tambahkan `https://simantab.disdikbud.batangkab.go.id/` ke daftar **Redirect URLs**, serta jalur callback persis yang benar-benar dipakai setelah menelusuri alur reset password/login. Pertahankan URL Cloudflare lama dan link yang masih dipakai pengguna.
3. Uji login Dinas/Sekolah, logout, lupa password, dan email konfirmasi di alamat resmi menggunakan akun uji. Pastikan tautan email tidak kembali ke Vercel atau domain yang keliru.
4. Setelah domain resmi lulus, ubah **Site URL** menjadi `https://simantab.disdikbud.batangkab.go.id/`, jika disetujui. Site URL dipakai sebagai redirect default pada email/reset password ketika `redirectTo` tidak ditentukan. Jangan mengubah default sebelum siap.
5. Uji RLS dan persetujuan role setelah login menggunakan domain resmi. **Jangan** menaruh Supabase `service_role` / secret key dalam JavaScript atau konfigurasi publik.
Referensi: https://supabase.com/docs/guides/auth/redirect-urls

## E. PWA, QR, dan transisi pengguna
- PWA dengan `start_url: /` dan aset relatif akan bekerja pada origin baru **setelah** domain HTTPS dan service worker diverifikasi. Origin baru dianggap aplikasi berbeda oleh browser: pengguna mungkin perlu memasang ulang PWA dan login kembali; **akun/data Supabase tetap utuh**.
- **Jangan** terbitkan QR domain resmi atau memaksa redirect dari `workers.dev` sebelum uji login dan reset password lulus.
- PWA offline **tidak** menyimpan data kepegawaian; navigasi membutuhkan koneksi.
- Selama masa transisi, biarkan alamat lama dapat diakses, dokumentasikan rollback domain dan build env.

## F. Persetujuan akhir (checklist go/no-go)
- [ ] Izin tertulis domain dari admin/Diskominfo dan bukti zone ownership.
- [ ] Konflik DNS dan kebutuhan paket/biaya Cloudflare terverifikasi.
- [ ] Custom Domain aktif, DNS/HTTPS valid, tidak ada intersepsi aplikasi Pemkab lain.
- [ ] Web login dan seluruh aset publik, PWA, QR dan Open Graph terbuka pada hostname resmi.
- [ ] Redirect URLs + Site URL Supabase sesuai, uji reset password/login/logout berhasil.
- [ ] Uji keamanan RLS 5 peran (Super Admin, Kabid, operator, pengawas, GTK) dan alur KP/Jabfung/KGB/Cuti/Diklat.
- [ ] Tidak ada perubahan data master GTK; cek ringkasan total 7.008 dan audit sample.
- [ ] Jalur rollback tertulis; alamat Worker lama tetap hidup sampai persetujuan.
- [ ] Izin cutover dan pengumuman URL resmi dari Disdikbud/Diskominfo.

**Status:** hanya *persiapan aplikasi*. Menggabungkan perubahan ini tidak mengubah DNS, alias Worker, URL Supabase Auth, database, atau domain resmi. Tanpa persetujuan admin domain dan QA fungsional, alamat resmi belum layak diumumkan.
