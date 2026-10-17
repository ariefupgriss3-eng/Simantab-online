# SIMANTAB — Tahap migrasi pembaca AI dari Vercel (17 Oktober 2026)

**Status: STAGING, BUKAN CUTOVER.** Jangan matikan aplikasi Vercel sebelum jalur Diklat KS lolos uji.

## Komponen riil
- **Jabfung:** `simantab-jabfung-ai-workflow` v5 sudah ACTIVE di Supabase. Kontrak GET `FREE_LOCAL_ONLY` dan POST HTTP 503 masih sama seperti v4. Semua kode panggilan Vercel yang tidak dapat dijangkau dihapus; OCR lokal tetap berlaku.
- **Diklat KS:** `simantab-diklat-ai-reader-staging` v1 ACTIVE di Supabase, **nonaktif secara default**; otentikasi pengguna/worker di dalam fungsi, NPSN tidak terkait, signed URL dibatasi ke berkas usulan sendiri, memakai native Google Gemini bila diaktifkan. Tidak ada pemanggilan provider AI atau biaya model saat disabled.
- **Dua pemanggil Diklat:** `simantab-diklat-ai-workflow` dan `simantab-diklat-ai-aggregate-worker` mempunyai kode *persiapan* untuk memilih backend dengan `SIMANTAB_DIKLAT_READER_BACKEND`. Secara default tetap Vercel. **Kode persiapan belum di-deploy ke fungsi produksi.**
- Supabase Auth, PostgreSQL, RLS, dokumen Storage, dan data 7.008 GTK tidak dimigrasikan/diubah.

## Kunci pengaktifan di Supabase Secrets (jangan disimpan di GitHub)
- `SIMANTAB_DIKLAT_READER_BACKEND=supabase_native` memilih reader Supabase setelah kedua workflow telah diperbarui dan diuji.
- `SIMANTAB_DIKLAT_AI_ENABLE=true` membuka transport native Gemini **setelah persetujuan privasi, batas biaya/kuota, dan uji dokumen anonim**.
- `SIMANTAB_GEMINI_API_KEY` diperlukan untuk Gemini API. **Jangan kirim API key melalui chat.** Simpan hanya di Secret Manager Supabase.

## Pengaman sebelum cutover
1. Tetapkan persetujuan tertulis untuk pengiriman dokumen personal (SKP, SKCK, NIP, nama) ke vendor AI. Ketentuan Google Gemini *free tier* memungkinkan input digunakan untuk peningkatan produk; tier gratis tidak boleh diasumsikan cocok bagi dokumen kepegawaian.
2. Tentukan anggaran **nol biaya** atau anggaran yang secara eksplisit disetujui, batas permintaan harian, dan penolakan otomatis bila kuota habis. Penggunaan free tier tidak otomatis menjamin nol tagihan pada semua konfigurasi.
3. Validasi contoh dokumen fiktif untuk hasil 7/7, kesalahan SKP 2024/2025, retry 1/7, berkas terpotong/buram, perlindungan URL, identitas user dan worker, serta fail-closed. Pastikan ada jalan verifikasi manual.
4. Deploy kedua pemanggil yang disiapkan, uji jalur **user dan worker agregat**, lalu ubah toggle hanya setelah uji.
5. Cek log keberhasilan, URL login, PWA, hak akses, serta seluruh layanan selain AI. Baru setelah itu lakukan cutover domain produksi dan pertimbangkan penonaktifan Vercel.

**Rollback:** kembalikan `SIMANTAB_DIKLAT_READER_BACKEND` ke `legacy` saat Vercel masih tersedia; atau nonaktifkan AI dan gunakan verifikasi manusia. Jangan mengubah database maupun dokumen pengguna.

Catatan: file `.vercel/output/static` adalah format direktori statis Cloudflare, bukan indikasi dependensi runtime pada Vercel.
