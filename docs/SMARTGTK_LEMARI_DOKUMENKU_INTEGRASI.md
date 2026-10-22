# SMART-GTK: Ambil dari Lemari Dokumenku

Integrasi pada PR #233 (Draft), modul frontend Cloudflare Preview dan fungsi backend Supabase aktif.

## Alur GTK
1. Login akun GTK yang terdaftar pilot → Dashboard GTK → SMART-GTK.
2. Laporan pendataan tersimpan, buka hasil skrining dan Dokumen Wajib PNS / Dokumen PPPK yang dimiliki.
3. Di setiap jenis dokumen klik **📁 Ambil dari Lemari Dokumenku**.
4. Pilihan hanya menampilkan file **milik akun yang login**, berukuran maksimal 1,5 MB, PDF/JPG/PNG, berkas masih ada di penyimpanan privat, dan **kode persyaratan asalnya sesuai jenis berkas SMART-GTK**.
5. Klik **Gunakan berkas ini**. Sistem menyimpan referensi ke bucket privat `simantab-documents`, tidak menggandakan file, tidak mengubah arsip asal dan tidak otomatis memverifikasi substansi dokumen.
6. Jika tidak ada dokumen cocok, sistem menampilkan **Belum ada berkas dengan jenis yang sesuai**. Klik **Unggah Berkas Baru** apabila diperlukan. Jangan menggunakan file SKCK, pakta integritas, atau dokumen diklat lain untuk mengganti SK Pangkat / Ijazah / SK Jabfung.

## Aturan pengamanan dan data
- RPC `smartgtk_cabinet_candidates(p_type)`: hanya milik `auth.uid()`, status kerja sesuai kebutuhan, peserta PILOT / OPEN berhak mengisi; kategori sumber harus cocok melalui `private.smartgtk_cabinet_code_matches`.
- RPC `smartgtk_import_cabinet(p_type,p_file_id)`: memvalidasi lagi pemilik, path yang diawali UUID pemilik, metadata, objek dalam `simantab-documents`, kategori, role dan rollout. Audit `CABINET_FILE_LINKED_<TYPE>`.
- Tabel `smartgtk_documents` memiliki `source_bucket` serta `cabinet_file_id` untuk membedakan berkas yang diunggah langsung dan berkas sumber lemari. Perubahan upload langsung mengganti tautan secara eksplisit.
- Status kelengkapan serta monitoring Dinas menghitung dokumen ber-referensi hanya ketika file sumber masih ada dan metadata serta kode sumber masih sah. `BERKAS_LENGKAP` berarti seluruh file tercatat, **bukan lolos pemeriksaan Dinas**.
- Non-ASN tetap tidak bisa menggunakan fitur unggah/pengaitan. Akses anonim ditolak. Mode rollout tetap PILOT.
- Dokumen tidak disalin ke bucket SMART-GTK, sehingga jika berkas sumber dihapus maka referensi itu menjadi tidak memenuhi kelengkapan lagi.

## Verifikasi 21 Oktober 2026
- CI Cloudflare dan PostgreSQL sintetik menguji pengaitan, kepemilikan, pengurangan duplikasi, berkas >1,5 MB, non-ASN, dan penolakan dokumen SKCK yang tidak sesuai.
- Migrasi `smartgtk_lemari_document_reference_20261021` diterapkan berhasil pada Supabase aktif. **486 profil**, **1 laporan SMART-GTK**, **0 referensi SMART-GTK** tetap tidak berubah setelah migrasi.
- Untuk akun pilot Kepala Sekolah, Lemari Dokumenku memiliki 7 file, namun **tidak ada kode yang cocok** dengan ketiga berkas wajib dalam laporan SMART-GTK saat ini (SK Pangkat, Ijazah Terakhir, SK Jabfung). Sistem sengaja tidak mengaitkan sembarang file secara otomatis.
- Perubahan frontend tersedia di Cloudflare Preview (aset `smartgtk-unified.js?v=8`), PR masih Draft; belum deploy produksi. Pengujian klik pada akun nyata setelah preview terbaru tersedia masih diperlukan.
