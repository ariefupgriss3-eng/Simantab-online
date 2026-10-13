# Pembatasan Usulan Pembinaan Disiplin dan Perceraian — SIMANTAB-ONLINE
Tanggal: 13 Oktober 2026.

## Keputusan operasional
Usulan awal `PEMBINAAN_DISIPLIN` dan `PERCERAIAN` di `supervision_cases` hanya dapat dibuat oleh:
- **15 pimpinan Korwil Kecamatan** yang juga memiliki akun Pengawas SD; masing-masing memiliki jenjang pengusulan `SD` dan penanda kecamatan.
- **4 Pengawas SMP aktif**, masing-masing memiliki jenjang pengusulan `SMP`.

Kabid, Kasi/Subkoor, dan admin/staf tidak diberikan hak baru untuk **membuat** kedua usulan; kewenangan menangani status/proses setelah pengajuan tetap mempertahankan aturan yang ada. Operator Korwil tidak otomatis mendapat hak pengusul. Pengawas SD lain dan Pengawas TK tidak otomatis mendapat hak.

## Implementasi keamanan
- Tabel `discipline_submitter_grants` menyimpan 19 izin **per-user**, dengan jenis pengusul, jenjang, kecamatan (Korwil), dan status aktif; RLS aktif. Data tidak boleh diubah oleh pengguna umum.
- Fungsi `private.can_submit_sensitive_case(scope_level)` memeriksa `auth.uid()`, daftar izin, status akun aktif, `role=PENGAWAS`, `account_channel=DINAS`, serta kesesuaian `position` dan jenjang.
- Kebijakan RLS `cases_insert` pada `supervision_cases` tetap mensyaratkan `created_by = auth.uid()`; untuk dua jenis usulan ini ditambahkan pemeriksaan fungsi di atas.
- Trigger `trg_prevent_sensitive_case_reclassification` menolak perubahan `case_type`, `scope_level`, atau `created_by` yang masuk/keluar dari kasus sensitif, mencegah jalan pintas lewat UPDATE. Perubahan `status` tetap diizinkan sesuai kebijakan UPDATE lama.
- Usul `PROMOSI_KARIR` tetap mengikuti hak lama; pembatasan ini tidak mengubah alurnya.

## Pemadanan identitas
Data yang dikirim untuk Subah menyebut *Rahayu Murdijati*; profil yang ada berbunyi **RAHAJU MURDIJATI**. Data Reban menyebut *Kabul*; profil tertulis **KABUL HINDARTO**. Masing-masing hanya menghasilkan satu profil aktif Pengawas SD pada pemeriksaan awal. Nama profil asli tidak diubah.

## Status
- Migrasi Supabase produksi `discipline_korwil_pengawas_smp_only_20261013`: berhasil diterapkan.
- Audit baca-saja: 15 Korwil (15 kecamatan), 4 Pengawas SMP, RLS `cases_insert` berubah, trigger dan fungsi server tersedia.
- Frontend **aktif di produksi** melalui Vercel project route rewrite `^/team-workflow-authority\\.js# Pembatasan Usulan Pembinaan Disiplin dan Perceraian — SIMANTAB-ONLINE
Tanggal: 13 Oktober 2026.

## Keputusan operasional
Usulan awal `PEMBINAAN_DISIPLIN` dan `PERCERAIAN` di `supervision_cases` hanya dapat dibuat oleh:
- **15 pimpinan Korwil Kecamatan** yang juga memiliki akun Pengawas SD; masing-masing memiliki jenjang pengusulan `SD` dan penanda kecamatan.
- **4 Pengawas SMP aktif**, masing-masing memiliki jenjang pengusulan `SMP`.

Kabid, Kasi/Subkoor, dan admin/staf tidak diberikan hak baru untuk **membuat** kedua usulan; kewenangan menangani status/proses setelah pengajuan tetap mempertahankan aturan yang ada. Operator Korwil tidak otomatis mendapat hak pengusul. Pengawas SD lain dan Pengawas TK tidak otomatis mendapat hak.

## Implementasi keamanan
- Tabel `discipline_submitter_grants` menyimpan 19 izin **per-user**, dengan jenis pengusul, jenjang, kecamatan (Korwil), dan status aktif; RLS aktif. Data tidak boleh diubah oleh pengguna umum.
- Fungsi `private.can_submit_sensitive_case(scope_level)` memeriksa `auth.uid()`, daftar izin, status akun aktif, `role=PENGAWAS`, `account_channel=DINAS`, serta kesesuaian `position` dan jenjang.
- Kebijakan RLS `cases_insert` pada `supervision_cases` tetap mensyaratkan `created_by = auth.uid()`; untuk dua jenis usulan ini ditambahkan pemeriksaan fungsi di atas.
- Trigger `trg_prevent_sensitive_case_reclassification` menolak perubahan `case_type`, `scope_level`, atau `created_by` yang masuk/keluar dari kasus sensitif, mencegah jalan pintas lewat UPDATE. Perubahan `status` tetap diizinkan sesuai kebijakan UPDATE lama.
- Usul `PROMOSI_KARIR` tetap mengikuti hak lama; pembatasan ini tidak mengubah alurnya.

## Pemadanan identitas
Data yang dikirim untuk Subah menyebut *Rahayu Murdijati*; profil yang ada berbunyi **RAHAJU MURDIJATI**. Data Reban menyebut *Kabul*; profil tertulis **KABUL HINDARTO**. Masing-masing hanya menghasilkan satu profil aktif Pengawas SD pada pemeriksaan awal. Nama profil asli tidak diubah.

## Status
- Migrasi Supabase produksi `discipline_korwil_pengawas_smp_only_20261013`: berhasil diterapkan.
- Audit baca-saja: 15 Korwil (15 kecamatan), 4 Pengawas SMP, RLS `cases_insert` berubah, trigger dan fungsi server tersedia.
 (route ID `12f76cfc-ab9c-4262-aaae-e208104e143f`), sumber JS pada GitHub commit `e3d791ec135302a3c28d9b6b1b0b04094057e970`, dipin lewat CDN jsDelivr. Versi routing produksi `7a2c571f-c07f-48a2-9208-db4e98180e95`. Formulir hanya muncul bagi akun berizin, jenjang dikunci sesuai daftar server, handler simpan memeriksa izin ulang. Uji pratinjau dan produksi HTTP 200 + penanda versi cocok; sintaks JS valid; tanpa full rebuild aplikasi.
- **Belum ada transaksi usulan sungguhan**, dan belum ada pengujian login setiap akun.

## Rollback terbatas
Rollback frontend: pulihkan versi Vercel project routes `0dd0cb93-3b37-42d5-87e9-a44f1197a3a0` (tepat dua aturan sebelumnya: Kabid workflow + HTTP 410 Jabfung), dan pastikan URL modul disiplin kembali ke versi lama. **Jangan hilangkan** pembatasan database dengan alasan tombol gagal muncul; itu adalah batas keamanan utama. Rilis ini tergantung CDN jsDelivr, sehingga ketersediaan upstream perlu dipantau.
Rollback kebijakan server hanya dengan prosedur SQL terdokumentasi, dan jangan menghapus data kasus lama tanpa keputusan khusus. Ingat: membatalkan pembatasan RLS dapat membuka kembali hak submit kepada semua pengguna terautentikasi, sehingga tidak direkomendasikan tanpa pengganti.
