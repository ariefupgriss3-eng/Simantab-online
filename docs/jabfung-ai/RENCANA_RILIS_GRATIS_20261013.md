# Rencana rilis aman — Verifikator Jabfung Gratis
**13 Oktober 2026 • PR #170 tetap draft • Pengaman biaya server telah diterapkan secara terbatas; frontend OCR belum produksi.**

## Tujuan
- OCR awal berjalan di browser memakai PDF.js + Tesseract.js bahasa **Indonesia dan Inggris** yang dikemas di origin SIMANTAB.
- **Tidak ada panggilan API model AI berbayar per dokumen**.
- Semua status OCR bersifat *saran awal*, tidak menyetujui/menolak usulan atau menilai keaslian SK/TTE.
- Pemohon, pejabat dan petugas tetap menggunakan sistem pengajuan dokumen dan RLS yang sudah ada.

## Tahap A — Uji source & browser sintetis, tanpa biaya token (dilaksanakan)
- Node unit/regresi: pemeriksaan kategori, tahun SKP, NIP tersamarkan, file 0 byte, hak keputusan manusia.
- Chromium desktop: PDF teks sintetis **Terbaca awal**.
- Chromium viewport Android simulasi: PNG sintetis **Terbaca awal**.
- Chromium image-only PDF scan: mesin OCR berfungsi; hasil **Perlu telaah** sesuai kualitas teks.
- Browser uji memblokir permintaan eksternal, termasuk AI Gateway/CDN; **0 panggilan provider**.
- Pemeriksaan aset browser dari paket npm: PDF.js, Tesseract worker/WASM, OCR `eng` dan `ind`.
- Batasan: ini **bukan pengujian di Android fisik** dan bukan login riil aplikasi.

## Tahap B — QA fisik tanpa data nyata (belum)
1. Android Chrome versi terbaru, RAM terbatas (4 GB) dan komputer desktop/laptop.
2. PDF teks, PDF hasil scan, JPG/PNG, file kosong, file >1,5 MB, file salah ekstensi.
3. Jalur `Kirim Usul` harus menyimpan dokumen dan tidak memanggil AI berbayar.
4. Dokumen riwayat harus tetap dapat dilihat dengan izin RLS yang sah; akun Pengawas/Korwil tidak melihat berkas di luar kewenangan.
5. Periksa pemakaian memori, waktu OCR, respons tombol dan kerja ulang.
6. Evaluasi kualitas Bahasa Indonesia, terutama PAK, SK Pangkat, SKP dan kata serupa.
7. **Jangan uji menulis ke basis data produksi**. Data harus sintetis dan lingkungan terisolasi.

## Tahap C — Audit biaya & ketergantungan, sebelum izin rilis
- Review biaya hosting/bandwidth dan ukuran aset OCR. Tidak ada tarif token AI, tetapi layanan Vercel/Supabase tetap mempunyai kuota.
- Pastikan aset pustaka dilayani dari domain SIMANTAB dan **tidak menggunakan CDN runtime**.
- Periksa lisensi sumber terbuka dan kebijakan privasi, hilangkan data pribadi dari log.
- Konfirmasi PWA lama tidak bisa lagi memanggil endpoint berbayar setelah guard produksi diaktifkan.
- Pastikan tombol lama tidak lagi menampilkan janji verifikasi AI generatif.

## Tahap D — Deployment bertahap (Wajib persetujuan baru dan terpisah)
**Jangan jalankan langkah berikut sekarang.**
1. Catat deployment produksi, proyek/database dan versi Edge yang aktif, jumlah pengajuan dan berkas saat itu.
2. Terapkan *paid-AI fail-closed guard* pada Supabase Edge Function, untuk mencegah PWA lama mengonsumsi token.
3. Pastikan guard di endpoint Vercel menjadi aktif, kemudian terapkan UI OCR lokal setelah validasi preview.
4. Periksa ulang pengajuan/berkas sama jumlahnya; lakukan satu pengujian baca-saja oleh akun yang sah.
5. Pantau tanda penggunaan AI berbayar, kesalahan HTTP, beban bandwidth dan masalah di Android.
6. Jika rollback UI dibutuhkan, **pertahankan guard server** agar biaya token tidak aktif kembali tanpa persetujuan.

## Catatan audit
- Pengujian Chromium dengan viewport seperti Android bukan bukti aplikasi berjalan baik pada perangkat Android asli.
- OCR pertama bukan keputusan administratif, bukan deteksi palsu/asli, dan bukan pengganti validasi TTE/QR.
- Tidak memodifikasi riwayat kegagalan AI historis pada database.
- PR sebelumnya untuk remediasi API berbayar #169 tetap **terpisah** dari alternatif gratis #170.

## Keputusan 13 Oktober 2026 — lanjut tanpa pengujian baru

**Arahan pengguna:** melanjutkan pekerjaan tanpa melakukan uji Android fisik/QA tambahan. Ini adalah keputusan **melewati pelaksanaan uji**, bukan bukti bahwa uji tersebut lulus, bukan otorisasi biaya, dan bukan persetujuan eksplisit untuk mengubah produksi.

**Pekerjaan yang boleh dilanjutkan sekarang:** audit statis sumber dan persiapan rencana rilis pada branch PR #170 saja. Tidak menjalankan perintah tes, tidak membuka paket dengan akun ASN, tidak melakukan merge, migrasi SQL, perubahan env, deployment Vercel/Supabase, atau aktivasi layanan berbayar.

### Hasil audit statis (tanpa mengeksekusi perubahan)

1. `web/jabfung-ai-read-edge.js` dan `supabase/functions/simantab-jabfung-ai-workflow/index.ts` memiliki respons `FREE_LOCAL_ONLY` untuk POST, sebelum jalur lama ke AI berbayar. **Namun pengaman ini hanya efektif jika kedua endpoint versi baru benar-benar terpasang.** Sebelum itu, klien PWA lama masih berpotensi mengakses AI berbayar.
2. Kode lama yang mengakses `ai-gateway.vercel.sh` atau endpoint Jabfung tetap berada di bawah early return pada branch. Untuk hardening selanjutnya, sebaiknya hapus kode berbayar tak-terjangkau setelah desain kompatibilitas disetujui; jangan mengartikan early return di branch sebagai pengaman aktif produksi.
3. `web/build.mjs` melakukan bootstrap dari URL produksi dan mengunduh sejumlah patch dari `main`. Sumber eksternal tersebut **tidak dikunci ke commit SHA**. Rilis reproducible dan keterikatan versi belum dapat dijamin dari peninjauan sumber saja.
4. OCR baru memakai pustaka yang di-host sendiri dan tidak memakai token model per dokumen. Kuota bandwidth, fungsi hosting, penyimpanan, dan penggunaan sumber daya perangkat **tetap mungkin berlaku**.
5. Hasil OCR hanya `TERBACA_AWAL` atau `PERLU_TELAAH`; verifikasi keaslian TTE/QR, keabsahan SK, persetujuan usulan, dan kewenangan berkas harus tetap melalui petugas serta RLS/Storage yang sah. Integrasi izin akun dan alur kirim usulan **tidak terbukti melalui pengujian nyata**.
6. Lingkungan Supabase yang teridentifikasi adalah proyek `SIMANTAB-ONLINE` (`tizxfzvgglkokzvsiwkg`), **bukan database QA terpisah yang siap dipakai**. Jangan membuat salinan berisi data ASN hanya demi melewati pengujian.

### Status persetujuan dan penanganan risiko

- **No-go otomatis untuk produksi:** menghilangkan pengujian bukan izin deploy; perlu perintah eksplisit terpisah yang menyebut **SIMANTAB-ONLINE produksi** beserta penerimaan risiko tanpa uji fisik/integrasi.
- Apabila izin itu diberikan, batas tindakan harus ditetapkan jelas; prioritas keamanan ialah fail-closed server untuk klien lama, verifikasi tak ada provider berbayar, baseline/rollback, kemudian UI OCR lokal. Jangan mengubah RLS, submissions atau submission_files tanpa izin khusus.
- Tidak ada pengujian baru atau perubahan produksi dalam pembaruan dokumen ini.

## Catatan eksekusi produksi terbatas — 13 Oktober 2026

Pengguna menyetujui tahap produksi terbatas pada 13 Oktober 2026, **tanpa QA fisik/integrasi tambahan**. Persetujuan ini diterapkan **hanya untuk pengaman penghentian AI berbayar Jabfung**, bukan persetujuan untuk mengganti seluruh UI SIMANTAB atau mengubah tabel/RLS.

### Diterapkan dan terkonfirmasi

- **Supabase produksi** proyek `SIMANTAB-ONLINE` (`tizxfzvgglkokzvsiwkg`): Edge Function `simantab-jabfung-ai-workflow` diperbarui dari v2 ke **v3**. Status `ACTIVE`, `verify_jwt=true`. Pada branch sumber baru, permintaan `POST` ditolak dengan `503`, kode `FREE_LOCAL_ONLY`, sebelum kode yang dahulu memanggil Vercel/AI Gateway. Tidak ada deploy fungsi lain ataupun migrasi SQL.
- **Vercel produksi** proyek `simantab-online` (`prj_ChfgweqCzP23QANr59NtWPSXX0oA`): project-level routing rule `aaa7b42a-c2a2-459e-befb-0daa84d2d5d4` aktif, versi `eee585a4-11b9-4529-8368-1bd7877d60fd`, pola `^/api/jabfung-ai-read/?$`, mengembalikan **HTTP 410**. Aturan ditinjau dan dipromosikan, lalu status `staged=false` diverifikasi. Tidak ada deployment frontend baru.
- Jalur Supabase dan endpoint Vercel yang sebelumnya dapat menimbulkan panggilan model berbayar Jabfung sudah digembok pada lapisan server/routing. **Hal ini tidak mematikan layanan AI lain di SIMANTAB** dan tidak menjamin nol biaya hosting normal.

### Belum diterapkan — no-go untuk penggantian seluruh UI tanpa pengamanan tambahan

- **UI OCR lokal gratis belum dipasang ke produksi.** PR #170 tetap draft, belum di-merge. Tampilan Jabfung lama masih dapat menunjukkan pesan bahwa AI mengalami kendala walau dokumen usulan telah berhasil disimpan.
- Peninjauan source menunjukkan `web/secure-build.mjs` merekonstruksi HTML dari alias produksi, sementara build `web/package.json` mengubah banyak modul SIMANTAB lintas layanan, bukan hanya Jabfung. Suite otomatis terdahulu menguji komponen OCR dan preview sintetis, **belum membuktikan keselamatan deployment penuh dengan akun dan RLS produksi**. Karena pengguna memilih tanpa QA lanjutan, risiko regresi ini tetap terbuka. Penggantian frontend penuh tidak dilakukan.
- Jika kelak pengguna meminta pemasangan UI, gunakan paket perubahan khusus Jabfung berbasis release produksi yang dipin, pisahkan dari pemutakhiran layanan lain; tetapkan strategi rollback untuk UI **tanpa membuka kembali endpoint AI berbayar**. Tinjau kembali implikasi biaya hosting dan kuota.
- Perubahan angka agregat dalam database produksi dapat terjadi karena transaksi pengguna yang berjalan bersamaan; jangan mengartikan dua snapshot hitungan sebagai perubahan akibat update kode pengaman. Tidak dilakukan perubahan database oleh langkah ini.
