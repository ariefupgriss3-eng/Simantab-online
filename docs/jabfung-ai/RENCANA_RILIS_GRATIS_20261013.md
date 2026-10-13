# Rencana rilis aman — Verifikator Jabfung Gratis
**13 Oktober 2026 • PR #170 masih draft • TIDAK ADA izin deployment produksi.**

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
