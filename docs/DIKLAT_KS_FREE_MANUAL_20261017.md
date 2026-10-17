# Diklat KS/BCKS — Mode Gratis dan Verifikasi Manual (Pilihan A)

Status: **aturan backend aktif di Supabase**; frontend membutuhkan deployment Cloudflare versi 21. Perubahan 17 Oktober 2026.

## Proses baru
1. Peserta menyimpan biodata dan mengunggah tujuh dokumen ke Supabase Storage; masing-masing PDF/JPG/PNG maksimal 500 KB.
2. Sebelum diajukan, pemeriksaan ringan dilakukan di browser: kelengkapan, jenis, ukuran, nama SKP 2024/2025, dan indikasi unggahan ganda. Pengecekan isi/keaslian dokumen **BUKAN OCR AI**, melainkan pemeriksaan petugas.
3. Fungsi `ks_bcks_submit_local → ks_bcks_submit_administrasi` memvalidasi ulang metadata dan mengajukan ke Kasi/Subkoor. Server tetap menegakkan aturan akses Diklat dan status pemohon.
4. Kasi/Subkoor mendistribusikan tugas dengan `submission_assign_staff_multi` atau `submission_assign_staff`, secara manual.
5. Staf/admin yang ditugaskan membuka dokumen di Storage dan memutuskan `ks_bcks_review_administrasi_local`: **sesuai** atau **perlu perbaikan**, dengan catatan; keputusan disimpan dalam jejak audit.
6. Kasi/Subkoor menelaah dan menggunakan `submission_coordinator_approve`, lalu Kabid melalui `submission_kabid_approve`. Tidak ada persetujuan otomatis oleh AI.
7. Riwayat penilaian AI sebelum perubahan tetap tersedia untuk audit historis, bukan keputusan usulan baru.

## Pengamanan
- Tiga trigger otomatis khusus Diklat KS dinonaktifkan; data dan trigger layanan lain tidak diubah.
- Hanya akun Dinas aktif/disetujui yang ditugaskan dapat membuka rincian dan memverifikasi. RLS `ks_bcks_details_assigned_staff_read` hanya untuk penerima tugas.
- Kedua Edge Function `simantab-diklat-ai-workflow` dan `simantab-diklat-ai-aggregate-worker` mengembalikan `MANUAL_REVIEW_ONLY`, tidak mengirim dokumen ke Vercel ataupun AI eksternal.
- Reader Gemini staging ditutup. Jabfung tetap `FREE_LOCAL_ONLY`.
- Data lama saat implementasi: 121 selesai, 1 draft. Tidak ada status peserta yang diubah oleh migrasi.

## QA yang masih diperlukan setelah deploy
- Login peserta, simpan data, unggah 7 **berkas fiktif**, lalu `Ajukan ke Dinas`.
- Akun Kasi/Subkoor mengalokasikan ke satu staf Dinas; akun staf yang tidak ditugaskan harus tidak dapat melihat/menyetujui dokumen.
- Staf menolak sampel dengan catatan; peserta dapat memperbaiki. Ulangi dengan berkas fiktif yang valid.
- Staf setujui, Kasi/Subkoor setujui, Kabid setujui; peserta naik Level 2 hanya setelah persetujuan Kabid.
- Pastikan tidak ada request ke Vercel `/api/diklat-ai-read` atau `ai-gateway.vercel.sh` dari layanan ini.
- Periksa build sukses, cache aset Diklat v21, notifikasi, PWA dan audit events.

**Penting:** jangan uji menggunakan usulan definitif 121 peserta yang telah disetujui. Jangan menganggap pengecekan metadata sebagai OCR atau pembuktian keaslian hukum. 
