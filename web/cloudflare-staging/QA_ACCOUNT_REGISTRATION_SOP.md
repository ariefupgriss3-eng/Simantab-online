# SOP Penyiapan Satu Akun QA SIMANTAB (Persiapan Nonproduksi; Registrasi Terpisah)

**Status dokumen:** rancangan prosedur; **belum ada akun dibuat**. SOP ini disusun berdasarkan:
- `web/registration-ui-final.js` (alur UI registrasi)
- Supabase Edge Function aktif `simantab-register-pending` (pembuatan pengguna)
- Trigger Supabase `public.handle_new_user()` (profil, peran, status)
- `web/login-channel-hardening.js` (pemisahan kanal login)
- RLS `bcks_substansi_attempts` dan `ks_bcks_submission_details` (hak akses BCKS)

## Temuan yang menentukan pilihan akun

| Opsi pendaftaran | Persyaratan | Kondisi akun baru |
| --- | --- | --- |
| GTK | Nama, email aktif, kata sandi minimal 8 karakter. NIP opsional tetapi harus 18 digit jika diisi. | **Otomatis APPROVED dan aktif.** Tidak melalui persetujuan KS/Pengawas oleh Super Admin. |
| Kepala Sekolah | Nama, email, kata sandi; NPSN aktif 8 digit wajib. | PENDING dan tidak aktif sampai Super Admin menyetujui. |
| Pengawas | Nama, email, kata sandi; NIP sah 18 digit wajib. | PENDING dan tidak aktif sampai Super Admin menyetujui. |
| Dinas | Pendaftaran mandiri Dinas dinonaktifkan pada UI registrasi final; akun Dinas diatur Admin. | **Jangan gunakan** peran Dinas untuk uji ini. |

**PENTING:** SIMANTAB belum memiliki peran `QA_TEST`. Pengguna GTK yang dibuat untuk QA tetap merupakan pengguna sungguhan di proyek Supabase produksi. Karena itu, jangan menyatakan bahwa akun tersebut terbatas secara teknis hanya ke menu QA. Pembatasan pelaksanaan adalah **prosedural** dan harus disertai uji RLS tersendiri.

## Tahap A — Persiapan (tanpa penulisan database)

1. Tetapkan seorang penanggung jawab pengujian dan Super Admin SIMANTAB yang akan mengawasi.
2. Pilih **email institusi yang benar-benar dikuasai tim QA dan belum pernah dipakai**. Jangan membagikan email, kata sandi, token atau kredensial ke GitHub atau percakapan AI.
3. Gunakan label nama **SIMANTAB QA TEST** yang jelas berbeda dari nama pegawai asli; tetapkan pencatatan internal bahwa ini identitas fungsional untuk uji sistem, bukan GTK riil.
4. Pilih `GTK`, bukan `KEPALA_SEKOLAH` atau `PENGAWAS`. Biarkan NIP dan NPSN kosong; jangan mengarang nomor identitas.
5. Pastikan tidak ada penugasan layanan, NPSN sekolah, usulan BCKS, atau aktivitas ujian untuk akun QA.
6. Tetapkan tanggal mulai/selesai uji dan mekanisme penonaktifan akun oleh Super Admin setelah pengujian. Jangan hapus akun tanpa audit keterkaitan data.
7. Tentukan cara menyimpan token **hanya di sistem pengujian yang disetujui**. Jangan merekam JWT, refresh token, password, email, ID akun atau identitas pegawai di laporan publik.

## Tahap B — Registrasi resmi (HANYA setelah persetujuan operasional eksplisit)

1. Penanggung jawab membuka URL SIMANTAB **Vercel produksi** pada browser yang dipercaya.
2. Pilih **Daftar Sekolah / GTK / Pengawas**; isikan nama label QA, email QA dan kata sandi yang dibuat serta disimpan secara privat.
3. Pilih jenis akun **GTK**. Tidak perlu NIP maupun NPSN untuk jenis akun ini.
4. Klik daftar **sekali**. UI/server membuat akun pada proyek Supabase SIMANTAB yang sudah ada; pendaftaran bukan simulasi.
5. Verifikasi sebagai Super Admin melalui antarmuka resmi bahwa peran `GTK`, kanal `GTK`, status `APPROVED`, `is_active=true`, dan tidak ada penugasan aktif. Jangan mengubah profil peserta lain.
6. Bila ada ketidaksesuaian, hentikan uji dan **jangan** ubah RLS atau persetujuan secara otomatis.

**Catatan:** Prosedur ini memang menambah satu pengguna nyata ke Supabase produksi. Sebelum tindakan tersebut diperlukan persetujuan operasional bahwa akun QA sungguh akan dibuat. Tidak ada akun dibuat ketika SOP ini ditulis.

## Tahap C — Uji baca-saja dengan satu akun yang disetujui

1. Login hanya dengan akun QA pada kanal **GTK**.
2. Periksa pembacaan profil milik sendiri, kesesuaian peran, status persetujuan, dan bahwa kanal Dinas tidak dapat diakses.
3. Penguji tidak boleh membuka, mengubah, mengirim, menilai, mengatur waktu, atau mencoba menyelesaikan ujian BCKS.
4. Verifikasi bahwa akun QA **tidak memiliki** baris `ks_bcks_submission_details` yang menyatakan layak mengikuti sesi.
5. Uji negatif akses lintas identitas hanya melalui pemeriksaan resmi yang telah diaudit; jangan bereksperimen dengan ID peserta sungguhan.
6. Adapter `supabase-auth-readonly.mjs` dan `auth-integration-gate.mjs` harus tetap **tidak dipasang ke Worker publik**. Aktivasi pembacaan token nyata memerlukan izin terpisah, private test runner yang memadai, dan audit log non-PII.
7. Jangan menganggap keberhasilan uji ini sebagai bukti lengkap fungsi migrasi Cloudflare: ketiga API AI dan seluruh RLS layanan masih memerlukan validasi.

## Tahap D — Penutupan

1. Catat hasil lulus/gagal tanpa identitas pribadi atau kredensial.
2. Minta Super Admin menonaktifkan akun QA **setelah izin eksplisit** dan memastikan tidak ada pengajuan atau data yang harus dipertahankan.
3. Cabang `main` Vercel, SIMANTAB Emergency, nilai resmi 119 peserta, dan database layanan lain tetap tidak berubah.
4. Jangan alihkan DNS, aktifkan koneksi Supabase dari staging publik, atau turunkan Vercel sebelum uji akhir dan rencana rollback disetujui.

## Titik keputusan saat ini

**Belum ada email QA yang ditetapkan, persetujuan operasional pembuatan pengguna nyata, atau bukti verifikasi akun QA. Tidak ada tindakan registrasi dilaksanakan.**
