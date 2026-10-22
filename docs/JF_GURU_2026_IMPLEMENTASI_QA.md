# Modul JF Guru 2026 — Rencana Implementasi dan QA

Dasar: Surat Dirjen GTK Nomor **0294/B/B.B1/HK.07.00/2026** tanggal 27 Juli 2026, lampiran Panduan Teknis Penyesuaian Nomenklatur Jenjang Jabatan dan Pengangkatan ke Dalam JF Guru. **Modul ini terpisah** dari layanan `E_JABFUNG` yang sudah ada dan bukan integrasi resmi I-Mut, SIASN, SIMPEG, ataupun penerbit SK.

## Jalur dan tenggat
1. **NOMENKLATUR**, tenggat surat **11 Mei 2027**. Bukti utama: SK JF Guru lama, SK KP terakhir, ijazah (S-1/D-IV; diploma perlu penanganan khusus). Tidak ada pelantikan. Guru D-I/D-II/D-III perlu memenuhi S-1/D-IV sebelum **11 Mei 2030**; fitur pelacakan khusus diploma perlu dikembangkan lebih lanjut. Formulir juga menyediakan SLTA dan SPG untuk **pencatatan dan pemeriksaan kasus historis**, tanpa menganggapnya otomatis memenuhi persyaratan atau menerima masa transisi yang sama dengan diploma.
2. **PENGANGKATAN**, tenggat **11 Mei 2028** untuk PNS formasi JF Guru yang menjalankan tugas guru tetapi belum diangkat. Pangkat sekurang-kurangnya III/a, S-1/D-IV, usia pengangkatan/pelantikan sebelum 58 tahun, tanpa uji kompetensi. Dokumen: SK KP, ijazah S-1/D-IV, serdik, surat pengalaman mengajar 2 tahun, hasil kinerja dua tahun terakhir minimal Baik. **Validasi substantif oleh petugas, bukan mesin.**
3. Proses internal: `DRAFT → SUBMITTED → VERIFIED → DISETUJUI_DINAS → DIKIRIM_BKPSDM → SK_TERBIT`; status perbaikan dapat dicatat oleh petugas. Penetapan SK memerlukan nomor, tanggal, dan salinan SK. Status `DIKIRIM_BKPSDM` ditandai petugas setelah tindakan administratif nyata, bukan otomatis.

## Rute aplikasi
- GTK masuk ke `Layanan Kepegawaian` → `Penyesuaian dan Pengangkatan JF Guru 2026`.
- Pemohon memakai NIP yang cocok dengan profil SIMANTAB, memilih tepat satu jalur dan mengunggah PDF/JPG/PNG dengan ukuran maksimum **1,5 MiB**.
- Jalur Nomenklatur menyediakan enam pilihan jabatan sesuai SK: Guru Pertama/Muda/Madya dan Guru Ahli Pertama/Muda/Madya. Jalur Pengangkatan, yang tidak mengasumsikan SK Jabfung lama, mencatat posisi/tugas mengajar saat ini secara opsional.
- Akun Dinas hanya memantau/verifikasi sesuai wewenang dan tidak dapat membuat draf pemohon. Pendidikan terakhir wajib dipilih berdasarkan ijazah; belum ada kolom pendidikan terverifikasi pada profil saat ini.
- Petugas berotorisasi (`SUPER_ADMIN`, `KABID`, `KASI_SD`, `KASI_SMP`, `SUBKOOR_TK`, `STAFF_USUL_SK`, `STAFF_PROMOSI`) dapat memantau, meminta perbaikan, memverifikasi, mencatat pengiriman ke BKPSDM dan pengesahan SK.
- Rekap CSV bagi petugas **di-audit** di `jf2026_export_audit`; berkas menggunakan bucket privat `simantab-jf-guru-2026` dengan RLS dan URL bertenggat.
- Nama dan NIP hanya berada di database privat; tidak diletakkan dalam repo atau query logging yang tidak perlu.

## Urutan penerapan
1. **Backup** database produksi dan metadata storage. Pastikan tidak ada tabel/bucket nama sama dengan isi yang berbeda.
2. Review dan jalankan migrasi awal `supabase/migrations/20261020093000_jf_guru_2026_surat_0294.sql` jika belum terpasang, kemudian migrasi pengaman `supabase/migrations/20261020134500_jf2026_gtk_only_applicant_guard.sql` serta migrasi pendidikan historis `supabase/migrations/20261020142000_jf2026_legacy_education.sql` melalui jalur migrasi resmi Supabase (staging disarankan). Migrasi pengaman **belum diterapkan otomatis di produksi** saat PR dibuat; rilis harus ditahan sampai pengaman backend terpasang dan diuji.
3. Uji RLS dan RPC dalam sesi GTK A, GTK B, petugas berizin, petugas tanpa izin dan anonim.
4. Bangun aplikasi memakai `npm run build` dari folder `web`. Skrip injeksi yang baru adalah tahapan terakhir dalam `web/package.json`.
5. Pastikan preview tidak merusak `E_JABFUNG`, layanan kenaikan pangkat, login GTK/Dinas, menu kepala sekolah, dan profil.
6. Setelah lulus QA dan persetujuan Kabid/BKPSDM, rilis frontend; pantau galat selama 24 jam. Jika perlu rollback frontend, pertahankan data transaksi di tabel baru; jangan drop tabel.

## Skenario uji wajib
- Pemohon dengan NIP yang tidak sama dengan profil: server menolak.
- Dua akun mengajukan satu NIP+jalu: unique constraint menolak duplikasi.
- File kosong, format tidak diizinkan, ukuran >1.5 MiB: ditolak.
- File metadata tanpa objek storage: trigger menolak.
- Pemohon mengirim tanpa dokumen wajib: RPC menolak; draf tetap tersimpan.
- Pengangkatan hanya dapat dikirim dengan pernyataan formasi PNS, S-1/D-IV, tanggal lahir, dan minimal III/a (belum berarti verifikasi substantif).
- Akun GTK tidak dapat melihat/mengubah berkas milik GTK lain.
- GTK tidak dapat melakukan update status langsung ke `SK_TERBIT` maupun menjalankan RPC petugas.
- Petugas tidak dapat melompati status, tidak dapat menandai SK terbit tanpa bukti.
- Catatan perbaikan wajib terisi; perubahan status dicatat dalam `jf2026_events`.
- Rekap petugas mencatat riwayat permintaan ekspor dalam `jf2026_export_audit`.
- Menu `E_JABFUNG` eksisting dan unggahan lama tetap bisa diakses; tidak ada migrasi massal otomatis.
- Uji kelayakan khusus **usia mendekati/≥58 tahun** dan perbedaan jenjang-pangkat sebagai keputusan manusia; sistem **belum** memblokir otomatis berdasarkan usia.

## Batasan rilis pertama
- Belum ada API resmi I-Mut/SIASN/BKPSDM. Status eksternal hanya dilaporkan petugas berdasarkan dokumen sumber.
- Belum ada impor massal 5.000 guru atau pencocokan otomatis seluruh data SIMANTAB. Perlu pemetaan NIP/akun tervalidasi dan persetujuan aturan hak akses sekolah sebelum fitur impor.
- Belum membuat rekomendasi hukum otomatis; kualifikasi ijazah lama, umur, dan kesetaraan pangkat/jenjang harus diperiksa petugas.
- Belum ada persetujuan/pengesahan oleh BKPSDM di dalam SIMANTAB: sistem hanya mencatat hasil resmi, bukan menggantikan kewenangan BKPSDM.

## Modul terpisah Pemenuhan S-1/D-IV (monitoring 2030)
- GTK dengan ijazah terakhir D-I/D-II/D-III mencatat status belum kuliah, sedang kuliah, atau lulus menunggu pemeriksaan, serta kampus, program studi, tahun masuk, target kelulusan dan bukti ijazah. Pemantauan tenggat **11 Mei 2030** berlaku sesuai cakupan ketentuan untuk kelompok diploma.
- GTK berijazah SLTA/SPG dapat masuk pendataan pembinaan, **tetapi tenggat transisi diploma tidak otomatis diberlakukan**; status kelayakan hukumnya wajib ditelaah manual.
- Guru dapat memperbarui progres sendiri, tetapi tidak dapat mengubah verifikasi. Dinas memeriksa bukti ijazah lewat tautan privat yang berlaku singkat dan mencatat alasan, perbaikan, atau hasil verifikasi administratif.
- Dashboard Dinas memuat daftar guru yang sudah mendaftar pada modul ini, bukan populasi otomatis seluruh GTK Batang. Data 0 bukan berarti tidak ada guru yang belum S-1/D-IV.
- Migrasi tambahan **`supabase/migrations/20261020162000_jf2030_qualification_monitoring.sql`** harus dijalankan pada staging, diuji terpisah, dicadangkan, dan baru dapat dipertimbangkan untuk produksi sesudah persetujuan dan QA. Preview frontend dapat tampil sebelum database tersedia tetapi tidak boleh menyimpan transaksi sampai migrasi diterapkan.
- Verifikasi administrasi ijazah **bukan** penetapan gelar, hak transisi, SK JF, atau persetujuan BKPSDM.

## Kualitas data identitas dan cakupan pemantauan
- Data akun aktif/disetujui (jalur GTK dan Kepala Sekolah) dalam SIMANTAB **bukan** sensus lengkap guru Batang. Data pendidikan belum tersedia di tabel `profiles`; pendidikan tidak boleh disimpulkan dari NIP, gelar, jabatan, atau sekolah.
- Pemetaan menggunakan `owner_id` dan kecocokan NIP 18 digit. NIP aktif ganda ditandai sebagai **ambigu** dan tidak digabung otomatis, tidak dihapus, serta dikecualikan dari daftar tindak lanjut individu hingga rekonsiliasi.
- Fungsi Dinas `jf2030_coverage_summary()` hanya mengembalikan agregat (akun aktif, NIP valid, NIP unik, ganda, sudah/belum mengisi). Fungsi `jf2030_coverage_unreported(page,limit)` menampilkan maksimal 50 akun GTK aktif/disetujui dengan NIP **tunggal** yang belum mengisi data pendidikan, hanya untuk petugas berizin.
- **Belum mengisi pendidikan ≠ belum S-1/D-IV**. Daftar belum mengisi hanya untuk sosialisasi/pengingat, tidak boleh diterbitkan sebagai laporan jumlah guru belum S-1.
- Uji pada PostgreSQL sintetis dan validasi akses Dinas/GTK terlebih dahulu. Migrasi `supabase/migrations/20261020182500_jf2030_coverage_reconciliation.sql` belum dijalankan di produksi.

## Pemasangan Supabase resmi — 20 Oktober 2026
- Sesuai persetujuan pengguna, pada proyek Supabase SIMANTAB aktif `tizxfzvgglkokzvsiwkg` telah dipasang migrasi `jf2030_qualification_monitoring` (versi Supabase `20261020141255`) dan `jf2030_coverage_reconciliation` (versi Supabase `20261020141313`) melalui konektor Supabase. **Bukan** pemasangan otomatis dari deployment GitHub/Cloudflare.
- Kondisi sebelum dan setelah: 486 profil, 0 kasus JF Guru 2026; tidak ada data pendidikan 2030 yang diimpor atau ditulis atas nama GTK. Modul baru dimulai dari 0 entri.
- Hasil audit: dua tabel baru RLS aktif; bucket `simantab-jf-ijazah-2030` privat maksimal 1,5 MiB; 5 RPC `jf2030_*` hanya dapat dieksekusi oleh peran `authenticated`, bukan `anon`. Pemeriksaan akses pengguna Dinas dan GTK tetap dilakukan secara runtime oleh SQL; audit lulus secara statis, uji manual akun nyata masih diperlukan.
- Permintaan refresh skema PostgREST `pg_notify('pgrst','reload schema')` telah dijalankan.
- Migrasi pada repositori memakai nomor versi file yang berbeda dari nomor versi yang diberikan Supabase pada saat aplikasi langsung; karena itu kebijakan RLS migrasi pendidikan dilindungi dengan `IF NOT EXISTS` agar penerapan ulang di deployment berikutnya tidak menggagalkan rilis. Tetap audit histori migrasi sebelum `db push`.
- Dua temuan kualitas data sebelum deployment: beberapa akun GTK memakai NIP yang sama; verifikasi identitas perlu direkonsiliasi sebelum pemutakhiran pendidikan untuk mencegah kekeliruan personifikasi. Status 'belum melapor' bukan bukti 'belum S-1/D-IV'.

## Pilihan guru yang telah menyelesaikan S-1/D-IV atau lebih tinggi
- Pendidikan terakhir sekarang meliputi **SLTA, SPG, D-I, D-II, D-III, S-1, D-IV, S-2, dan S-3**. Tidak boleh disimpulkan dari gelar pada nama atau NIP; pengguna menyatakan pendidikan berdasarkan ijazah aktual.
- GTK berijazah **S-1/D-IV/S-2/S-3** diberi status mandiri `SUDAH_MEMENUHI` (baru berupa **pernyataan**, bukan data terverifikasi). Tanggal lulus wajib diisi berdasarkan ijazah. Bukti ijazah disimpan dalam bucket privat, lalu diverifikasi staf berwenang berdasarkan berkas, dengan alasan keputusan tercatat.
- Penjelasan hukum ditampilkan **setelah pendidikan dipilih**. Guru D-I/D-II/D-III menerima keterangan tenggat 11 Mei 2030; SLTA/SPG menerima informasi telaah khusus, sedangkan GTK yang sudah S-1/D-IV atau lebih tinggi menerima informasi verifikasi ijazah. Saat pendidikan belum dipilih, teks tetap netral.
- Pembaruan skema `supabase/migrations/20261021101000_jf2030_qualification_completed.sql` bersifat aditif pada record dan menjaga RLS. Terapkan hanya sesudah pengujian CI pada PostgreSQL sintetis; jangan menambahkan penanda `TERVERIFIKASI` otomatis.

### Pemasangan pembaruan pendidikan S-1/D-IV+ — 21 Oktober 2026
- Sesuai persetujuan pengguna untuk melanjutkan penyempurnaan modul, migrasi `jf2030_qualification_completed` diterapkan dengan sukses ke proyek Supabase aktif `tizxfzvgglkokzvsiwkg` melalui `apply_migration`, setelah Cloudflare dan PostgreSQL sintetis lulus.
- Audit pascamigrasi: 486 profil tetap, 0 usul Jabfung lama, 0 baris pelaporan pendidikan dan 0 audit pendidikan. Satu kebijakan upload privat tetap ada. Fungsi simpan, lampirkan ijazah dan verifikasi mendukung `SUDAH_MEMENUHI`, tetapi akun `anon` tidak berhak menjalankannya.
- Perubahan UI versi `jf-qualification-2030.js?v=3` tetap berada di PR Draft #233. **Rilis frontend dan uji GTK nyata masih harus diverifikasi terpisah** sebelum dinyatakan tersedia bagi semua pengguna.

### Status dokumen belum tersedia (preview 2026-10-21)
- UI GTK dan monitoring Dinas menghitung status dokumen dari `study_status`, `review_status`, dan `evidence_path` yang sudah ada. Tidak membuat kolom baru dan tidak mengubah data GTK.
- Pada pendidikan S-1/D-IV/S-2/S-3 yang sudah dilaporkan namun belum mengunggah berkas, tampil `Sudah Memenuhi (Pernyataan GTK) — Dokumen Belum Tersedia`. Ini bukan status ijazah terverifikasi, tidak menggantikan pemeriksaan administratif.
- GTK dapat menyimpan data tanpa ijazah digital dan mengunggahnya saat tersedia. Monitoring Dinas membedakan bukti belum tersedia, bukti terunggah belum ditelaah, butuh perbaikan, dan terverifikasi. Tombol verifikasi tetap dikunci jika `evidence_path` belum tersedia.
- Tidak ada relaksasi RLS atau fungsi penetapan otomatis, dan tidak ada migrasi database untuk perubahan tampilan ini.
