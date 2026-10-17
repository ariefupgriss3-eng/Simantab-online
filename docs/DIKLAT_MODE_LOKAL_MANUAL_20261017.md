# SIMANTAB — Mode A: Diklat KS Lokal Gratis + Verifikasi Petugas
Tanggal penerapan backend: 17 Oktober 2026

## Kebijakan yang berlaku
Tidak mengirim dokumen Diklat KS ke Google Gemini, Vercel AI Gateway, atau penyedia model AI pihak ketiga. **Pemeriksaan awal lokal bukan OCR**: ia memastikan header file PDF/JPG/PNG sesuai jenis MIME (sebelum unggah); server memeriksa ukuran maksimum 500 KB, kelengkapan ketujuh slot, serta indikasi tahun dan duplikasi dari metadata berkas. Keabsahan, isi, identitas, keterbacaan, tanda tangan, QR/TTE, serta kebenaran tahun pada isi dokumen **wajib diperiksa petugas manusia**.

## Alur
1. GTK masuk ke Cloudflare SIMANTAB → Diklat KS/BCKS → simpan data → unggah 7 berkas ke **Supabase Storage** sesuai RLS.
2. GTK klik **Ajukan**. RPC `ks_bcks_submit_local` mengecek bahwa akun pemilik disetujui, akses modul tidak ditutup/diblokir, metadata dan 7 berkas sah (RPC preflight lama), lalu menandai `MENUNGGU_DISPOSISI_KOORDINATOR`.
3. Kasi/Subkoor menugaskan petugas lewat workflow `submission_assign_staff_multi`, menjadi `VERIFIKASI_STAF`.
4. Petugas melihat dan membaca dokumen sendiri, lalu memakai `ks_bcks_review_administrasi_local`. Hanya admin/staf yang ditunjuk atau Super Admin/Kabid aktif dapat mengambil keputusan. Penolakan wajib disertai catatan dan mengembalikan dokumen untuk diperbaiki.
5. Setelah verifikasi positif, alur melewati Kasi/Subkoor dan Kabid; persetujuan final tetap mengikuti RPC `submission_coordinator_approve` dan `submission_kabid_approve`.

## Keamanan dan batasan
- Dokumen tetap di Supabase Storage; **tidak seluruhnya offline**, sebab unggah dan verifikasi petugas tetap memerlukan internet. Hanya pemeriksaan awal file dilakukan pada perangkat.
- Semua panggilan AI dokumen Diklat produksi sekarang fail-closed tanpa panggilan vendor. Fungsi lama `simantab-diklat-ai-workflow` v9, worker agregat v7, staging reader v2 nonaktif untuk AI; `Jabfung` v5 tetap FREE_LOCAL_ONLY.
- Keputusan lama, histori AI, dokumen, status lulus Diklat 2026, jumlah 7.008 GTK tidak dihapus atau diganti.
- UI Vercel lama tidak lagi cocok dengan backend manual dan memerlukan penerbitan frontend baru; untuk peserta gunakan Cloudflare **setelah** build commit baru SUKSES dan uji pengajuan manual selesai. Jangan matikan Vercel untuk layanan SIMANTAB lain sebelum QA seluruh modul selesai.
- Perbaikan aman memerlukan QA nyata oleh akun peserta uji, Kasi/Subkoor, dan staf Dinas. **Belum diuji dengan pengajuan pengguna sungguhan pada saat penerapan.**

## Checklist QA produksi (bukan asumsi)
- Validasi satu berkas PDF/JPG/PNG sah, tolak extension palsu, berkas >500 KB, tujuh slot belum lengkap.
- Cek bahwa peserta diblokir dan non-owner tidak bisa melakukan submit; tidak ada request ke host AI.
- Satu pengajuan uji: DRAFT → MENUNGGU_DISPOSISI_KOORDINATOR → VERIFIKASI_STAF → MENUNGGU_APPROVAL_KOORDINATOR → MENUNGGU_PERSETUJUAN_KABID → SELESAI.
- Uji penolakan wajib catatan, perbaikan/upload ulang, review manusia, persetujuan akhir.
- Audit Cloudflare Build, Login GTK, Operator, PWA, RLS, dan status usulan tanpa mengganggu peserta selesai Diklat.
