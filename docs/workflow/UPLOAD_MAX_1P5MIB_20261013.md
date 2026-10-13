# Penyelarasan Batas Unggah 1,5 MiB SIMANTAB — 13 Oktober 2026

## Kebijakan
Batas maksimum **setiap berkas** dokumen layanan kepegawaian SIMANTAB-ONLINE adalah **1.572.864 byte (1,5 MiB)**. Jenis berkas tetap PDF/JPG/PNG. Batas ini diterapkan pada layanan umum (termasuk layanan hasil surat Dinas/pensiun), KP, Jabfung, PTK baru swasta, SK PLT, Cuti, Pembinaan Disiplin, dan Diklat Kepala Sekolah. Impor daftar peserta kegiatan (xlsx/xls/ods/pdf) yang memiliki mekanisme dan batas tersendiri tidak diubah.

## Pemeriksaan awal
- Supabase produksi project `tizxfzvgglkokzvsiwkg`, bucket privat `simantab-documents` sudah memiliki `file_size_limit=1572864` dan `allowed_mime_types=[application/pdf,image/jpeg,image/png]`. Tidak diperlukan perubahan SQL bucket atau RLS.
- Formulir HTML utama produksi semula menggunakan 500 KB/512000 pada validasi generik; Jabfung sudah 1,5 MiB.
- Modul yang semula memakai 500 KB: `kp-enhancement.js`, `ptk-swasta-enhancement.js`, `sk-plt-enhancement.js`, `cuti-requirements.js`, `discipline-evidence.js`, `staff-service-roles.js`, `diklat-ks-bcks-v32.js`.
- Selain ketujuh modul aktif tersebut, kode lama Diklat `diklat-ks-bcks.js`, `diklat-ks-bcks-v31.js`, konfigurasi `inject-diklat.mjs` serta mekanisme `build.mjs`/`build-kadis.mjs` diselaraskan untuk rilis mendatang.

## Implementasi produksi — tanpa rebuild aplikasi
Vercel team `team_wftID9nGr6rf1OFW3WOol4Yt` project `prj_ChfgweqCzP23QANr59NtWPSXX0oA`. **Routes version `52103efa-50e9-44ed-8a2f-953fc227d248`, 13 aturan semuanya LIVE (`staged=false`).** Versi sebelumnya `7a2c571f-c07f-48a2-9208-db4e98180e95` memiliki 3 aturan asli (AI Jabfung blocked, Pembagian Tugas Kabid, formulir Korwil/SMP).

Perubahan baru berupa 10 routing rule:
1. `^/$` ke snapshot HTML `web/simantab-upload-1p5mb-index-20261013.html`, dengan transform response.header `content-type = text/html; charset=utf-8`.
2. `^/index\.html$` ke snapshot HTML sama dengan transform Content-Type yang sama.
3. `^/sw\.js$` ke snapshot Service Worker `web/simantab-upload-1p5mb-sw-20261013.js`, cache versi `simantab-pwa-v8` yang menghapus cache versi lama saat aktivasi.
4–10. Satu aturan per modul aktif `kp-enhancement.js`, `ptk-swasta-enhancement.js`, `sk-plt-enhancement.js`, `cuti-requirements.js`, `discipline-evidence.js`, `staff-service-roles.js`, `diklat-ks-bcks-v32.js`.

Semua rute mengambil berkas commit-pinned `83a5956286e302df98e3546046c8c995542ac75c` melalui jsDelivr. Snapshot `index.html` berasal dari HTML **produksi yang berjalan sebelum rilis**, dengan perubahan lima kemunculan batas 500 KB/512000, teks kebijakan umum, serta komentar marker `SIMANTAB_UPLOAD_LIMIT_1P5MIB_20261013`. Jangan memuat HTML .html langsung dari jsDelivr tanpa transform Content-Type — server CDN mengembalikan `text/plain` dan halaman akan menjadi teks!

## Verifikasi yang berhasil
- Staging: tujuh JS identik dengan sumber pinned GitHub (respons teks), lolos `new Function(source)`, HTTP 200 MIME JavaScript, tidak mengandung `512000` / `500 KB`, mengandung `1572864`; HTML / dan /index.html HTTP 200 MIME HTML, tanpa 500 KB; SW HTTP 200 MIME JavaScript versi cache v8.
- Produksi pascapromosi: halaman root dan root dengan query unik HTTP 200 text/html + marker baru; tujuh JS HTTP 200 MIME application/javascript, memiliki batas 1.572.864; SW v8 aktif.
- Modul Pembagian Tugas Kabid (PR #172) tetap marker Kabid; modul pembatasan Korwil/Pengawas SMP (PR #173) tetap marker korwil; endpoint AI Jabfung berbayar lama tetap HTTP 410. Tidak ada perubahan table data usulan, peran, RLS, pembayaran, atau deployment aplikasi utama.
- **Belum ada uji unggah berkas sungguhan dari akun pengguna.** Periksa pengalaman login/upload untuk dokumen 1,0 MiB dan tepat 1,5 MiB serta penolakan berkas >1,5 MiB saat sesi QA. Jangan memasukkan dokumen pegawai sungguhan untuk QA.

## Rollback
Jika terjadi gangguan yang hanya muncul setelah perubahan ini, **restore versi project routes `7a2c571f-c07f-48a2-9208-db4e98180e95`**. Tiga kebijakan utama sebelumnya tetap dipertahankan (blokir AI Jabfung, akses Kabid, Korwil/SMP). Jangan menghapus 3 route dasar tersebut. Pulihkan setelah verifikasi identitas project/team dan uji URL / (HTML) + ketiga aturan dasar.

## Catatan risiko
- Tampilan rilis ini bergantung pada **jsDelivr CDN**, meski sumbernya pinned ke commit GitHub; gangguan upstream bisa mengganggu tampilan. Tidak ada deployment Vercel baru karena pembuatan deployment sebelumnya ditolak HTTP 402 akibat tunggakan saldo tim.
- Browser/PWA yang sudah memasang SW lama bisa tetap membaca cache lama pada pemuatan awal. Tutup dan buka ulang SIMANTAB untuk memicu pemeriksaan SW, atau lakukan pembaruan PWA.
- Snapshot halaman HTML tidak otomatis menerima fitur HTML terbaru dari deploy masa depan. Saat Vercel billing normal, rilis gabungan melalui deployment immutable yang diverifikasi agar routing snapshot dapat dilepas.
- Batas `diklat-ai-read-edge.js` 500 KB untuk **pemrosesan AI dokumen** bukan batas unggah storage/UI; AI reader tidak diubah agar tidak mengaktifkan/meningkatkan layanan AI berbayar tanpa persetujuan.
