# Gerbang Aktivasi Terkendali — Pendidikan GTK 2030 dan JF Guru 2026

Dokumen kesiapan rilis pada **PR #233 (Draft)**. Kode berada di cabang `feature/cloudflare-jf-guru-2026-0294` dengan base `fix/ks-diklat-menu-visible-disabled-cloudflare-20261018`. Dokumen ini **bukan** persetujuan deployment produksi.

## 1. Kondisi yang sudah teruji

- Cloudflare Preview menayangkan modul `jf-qualification-2030.js?v=4`; pengujian bundle Cloudflare dan keamanan PostgreSQL berjalan lewat workflow `QA Cloudflare JF Guru 2026`.
- Database Supabase SIMANTAB sudah memasang migrasi Pendidikan 2030, cakupan akun, dan pendidikan S-1/D-IV atau lebih tinggi melalui jalur migrasi resmi. Tidak menjalankan ulang migrasi hanya karena PR selesai.
- Pengujian query **read-only** dengan hak akun GTK dan Kabid membuktikan masing-masing dapat membaca laporan pendidikan sesuai otorisasi.
- Terdapat laporan S-2 berstatus `SUDAH_MEMENUHI`, `BELUM_DITELAAH`, dan tidak memiliki `evidence_path`. Tidak diubah untuk uji coba, dan bukan dasar menyatakan ijazah telah terverifikasi.
- `documentStatus(q)` membedakan (a) pernyataan sudah memenuhi tetapi dokumen belum tersedia, (b) berkas terunggah menunggu pemeriksaan, (c) ijazah telah diverifikasi Dinas. Label dihitung dari data yang ada, tanpa kolom atau persetujuan palsu.
- Bucket bukti ijazah tetap privat; batas per berkas 1,5 MiB; pengguna anonim dilarang mengakses RPC pendidikan.

## 2. Gerbang wajib sebelum aktivasi umum

| Area | Kondisi lulus | Penanggung jawab uji |
|---|---|---|
| Preview GTK | GTK login di **Chrome** ke URL Preview, melihat menu JF Guru 2026 dan Pendidikan 2030 tanpa harus memakai PWA produksi | GTK uji |
| GTK tanpa berkas | Rekam pendidikan S-1/D-IV/S-2/S-3 yang sudah ada tetap terbaca, label **Sudah Memenuhi (Pernyataan GTK) — Dokumen Belum Tersedia**, tidak disuruh mengulang simpan, tidak ditandai terverifikasi | GTK uji |
| Dashboard Kabid | Kabid membuka monitoring dan melihat entri berkas belum tersedia secara konsisten, tanpa file palsu atau akses ke berkas GTK lain | Kabid |
| Validasi jabfung | Menu JF Guru 2026 tetap terpisah dari usulan kenaikan jenjang JF lama; penetapan SK tetap peran berwenang | Dinas |
| Perlindungan data | GTK lain tidak melihat laporan yang bukan miliknya; akun yang belum disetujui tidak berhak mengubah; Dinas hanya sesuai kebijakan akses | Admin keamanan |
| Cakupan data | Belum mengisi kualifikasi **bukan** belum S-1; NIP ganda masuk rekonsiliasi; data preview hanya yang sudah melapor | Kabid |
| Uji ketahanan | Refresh, logout/login, Chrome Android, re-open modal, dan PWA lama tidak menyebabkan kehilangan data atau duplikasi kartu | Admin teknis |
| QA otomatis | `cloudflare-bundle` dan `postgres-security` sukses pada **commit yang hendak dirilis** | GitHub Actions |
| Jalur rilis | Worker Cloudflare produksi, branch pemicu, nama proyek dan rollback deployment sebelumnya telah diketahui dan diperiksa | Admin Cloudflare |

## 3. Penerapan terbatas dan bertahap

1. **Tahap A — Preview:** GTK dan Kabid memeriksa tampilan menggunakan data yang memang sudah ada. Jangan mengunggah ijazah palsu.
2. **Tahap B — Pilot terkendali:** undang beberapa GTK sukarela dari kelompok sudah S-1/D-IV dan kelompok perlu pembinaan D-I/D-II/D-III. Hindari identitas NIP ganda hingga direkonsiliasi. Berikan prosedur bantuan jika dokumen digital belum tersedia.
3. **Tahap C — Monitoring:** Kabid memantau status pengisian, kualifikasi yang dinyatakan GTK, dokumen belum tersedia, berkas menunggu verifikasi, dan progres studi, tanpa menyebut data yang belum dilaporkan sebagai guru tidak memenuhi kualifikasi.
4. **Tahap D — Rilis umum:** setelah semua gerbang lulus, identifikasi target Worker Cloudflare yang tepat, siapkan pemulihan deployment versi sebelumnya, lalu **minta persetujuan eksplisit untuk rilis produksi**. Jangan menggabungkan PR ini ke `main` Vercel atau menjalankan SQL migrasi ulang tanpa rekonsiliasi versi riwayat migrasi.

## 4. Pemulihan bila UI bermasalah

- Kembalikan deployment Worker ke versi sebelumnya melalui Cloudflare; **jangan** menghapus tabel Pendidikan 2030 atau data GTK sebagai cara rollback tampilan.
- Lanjutkan SIMANTAB layanan lama tanpa mengganggu KGB, KP, tunjangan, usulan Jabfung lama, dan Diklat KS.
- Catat commit yang diterapkan, waktu, penguji, gejala dan hasil perbaikan. Tidak menyebarluaskan screenshot yang mengandung NIP lengkap di grup publik.

## 5. Status perencanaan

**Persiapan kode, migrasi dan tes:** tersedia. **Pengesahan rilis produksi:** belum diberikan. **Uji antarmuka Kabid pada sesi nyata:** masih diperlukan. **Deploy produksi:** jangan dilakukan sebelum gerbang di atas terpenuhi.

## Verifikasi antarmuka Kabid (screenshot uji)
- Tampilan monitoring Dinas memperlihatkan laporan S-2 yang sudah diisi GTK, tanpa bukti ijazah dan dengan status belum ditelaah. Tombol verifikasi terlihat dinonaktifkan ketika bukti belum tersedia.
- Label ambigu **Ijazah awal** dalam detail Kabid dibetulkan menjadi **Pendidikan terakhir** dan format jenjang S-2, D-IV, dan seterusnya diseragamkan. Perbaikan ini hanya pada UI, tanpa mengubah nilai pendidikan di database.
- Pemeriksaan lanjutan: seorang penguji Kabid memastikan perubahan label terlihat pada preview terbaru sebelum pilot terkendali.
