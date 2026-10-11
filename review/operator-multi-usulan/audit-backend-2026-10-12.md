# Laporan Audit Integrasi Backend Multi-Usulan SIMANTAB
Tanggal: 12 Oktober 2026 — **REVIEW / STAGING ONLY**

## Pembuktian dari metadata produksi (semua query SELECT; tidak ada perubahan)
- `school_master`: **51 SMP Negeri aktif**, **445 SD Negeri aktif**, dan **15 nilai kecamatan berbeda** pada SD Negeri aktif.
- `profiles`, `school_master`, `submissions`, `submission_files` sudah ber-RLS.
- `profiles`: dua trigger aktif membatasi perubahan role, unit, kanal, NPSN, dan status oleh pengguna biasa.
- `submissions`: INSERT/SELECT/UPDATE/DELETE policy lama masih mengizinkan akses berdasarkan `user_id=auth.uid()`; fungsi `private.route_submission_workflow` mengarahkan `SUBMITTED` ke `MENUNGGU_DISPOSISI_KOORDINATOR`.
- `private.recommended_staff_role('KGB')` → `STAFF_KGB`; `('CUTI')` → `STAFF_CUTI`.
- `service_requirements` **tidak memiliki entri CUTI/KGB** saat audit. Form Cuti saat ini punya enam variasi syarat di `web/cuti-requirements.js`, tetapi persyaratan KGB yang diverifikasi di backend belum lengkap.
- `qa_simantab_01`: **GTK, NPSN null, account_channel GTK, aktif**; tidak dimodifikasi.

## Implementasi cabang REVIEW
- `01-staging-schema-RPC-DRAFT-DO-NOT-DEPLOY.sql`:
  - Membuat `operator_assignments` dengan indeks unik SMP per NPSN dan Korwil per kecamatan.
  - Memisahkan `operator_submission_subjects` dari `submissions.user_id`, yang tetap merepresentasikan pemilik/pengirim.
  - RLS operator dapat membaca penugasan dan subjek miliknya, petugas dinas mengikuti kebijakan existing.
  - Kebijakan RLS restrictive membatasi INSERT/UPDATE/DELETE langsung pada `submissions` untuk **role operator**, agar perubahan melalui RPC server-side.
  - `operator_create_draft` memverifikasi `auth.uid()`, role aktif, penugasan, sekolah negeri aktif, NPSN/kecamatan, jenis layanan, NIP, jabatan, subtype Cuti, dan idempotency key sebelum menyimpan **status DRAFT saja**.
  - **Tidak ada fungsi mengirim atau menyetujui usulan** dalam fase ini.
- `operator-staging-rpc-adapter.mjs`: hanya mengirim data calon pemohon tanpa user_id, role, wilayah operator, status atau approval.
- `operator-staging-rpc-adapter.test.mjs`: pengujian mock tanpa koneksi Supabase.

## Celah yang TIDAK BOLEH dianggap selesai
1. Tidak ada *Supabase staging* terisolasi atau bukti pengujian PostgreSQL autentikasi nyata; rancangan SQL belum dieksekusi atau diperiksa compiler PostgreSQL.
2. RLS existing milik user masih dapat mengizinkan UPDATE status secara langsung bagi role nonoperator. Sebelum cutover, perlu kebijakan menyeluruh untuk Cuti/KGB, regresi staf, serta audit fungsi SECURITY DEFINER terkait.
3. Cuti/KGB existing saat ini bisa masuk dari jalur formulir lama; penguncian direct INSERT untuk GTK/KS harus dilakukan bersama migrasi UI, **bukan sekarang**.
4. Upload berkas `submission_files` dan `storage.objects` perlu aturan khusus untuk perubahan/penghapusan operator, validasi isi dan kelengkapan (maks 500 KB).
5. Harus diverifikasi apakah NIP pemohon benar-benar terdaftar di NPSN yang diajukan, bukan hanya berdasarkan pengakuan operator.
6. Status DRAFT perlu RPC terverifikasi untuk edit, hapus, unggah, kirim, perbaikan, dan konfirmasi; hanya fungsi pengajuan DRAF yang sekarang dirancang.
7. Dokumen/standar layanan KGB dan setiap jenis Cuti perlu disahkan sebelum formulir produksi diaktifkan.
8. Test akun (termasuk operator fiktif) hanya boleh dibuat pada staging; **jangan mengubah** `qa_simantab_01` produksi.

## Hasil pengujian yang benar-benar ada
- 7 dari 7 skenario lokal PostgreSQL yang telah ditunjukkan melalui pgAdmin pada percakapan sebelumnya.
- 17 dari 17 pemeriksaan fungsi otorisasi offline pernah lulus; ubahan terakhir penyelarasan nama kolom kecamatan **memerlukan pengulangan**.
- 13 dari 13 pemeriksaan interaksi pratinjau offline lulus.
- 5 dari 5 pemeriksaan flag build preview lulus.
- 19 dari 19 pemeriksaan adaptor RPC mock lulus setelah penambahan subtype Cuti.
- **Tidak ada** pengujian Supabase E2E / Storage / pengiriman dinas / implementasi database staging pada fase ini.

## Aturan penerapan
**Jangan merge ke main. Jangan men-deploy/mengaktifkan fitur operator, menjalankan SQL staging di produksi, atau membuat 66 akun.** Evaluasi staging dulu; final rollout membutuhkan persetujuan Bapak sebagai pemilik sistem.
