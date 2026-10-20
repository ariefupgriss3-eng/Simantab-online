# Modul JF Guru 2026 — Rencana Implementasi dan QA

Dasar: Surat Dirjen GTK Nomor **0294/B/B.B1/HK.07.00/2026** tanggal 27 Juli 2026, lampiran Panduan Teknis Penyesuaian Nomenklatur Jenjang Jabatan dan Pengangkatan ke Dalam JF Guru. **Modul ini terpisah** dari layanan `E_JABFUNG` yang sudah ada dan bukan integrasi resmi I-Mut, SIASN, SIMPEG, ataupun penerbit SK.

## Jalur dan tenggat
1. **NOMENKLATUR**, tenggat surat **11 Mei 2027**. Bukti utama: SK JF Guru lama, SK KP terakhir, ijazah (S-1/D-IV; diploma perlu penanganan khusus). Tidak ada pelantikan. Guru D-I/D-II/D-III perlu memenuhi S-1/D-IV sebelum **11 Mei 2030**; fitur pelacakan khusus diploma perlu dikembangkan lebih lanjut.
2. **PENGANGKATAN**, tenggat **11 Mei 2028** untuk PNS formasi JF Guru yang menjalankan tugas guru tetapi belum diangkat. Pangkat sekurang-kurangnya III/a, S-1/D-IV, usia pengangkatan/pelantikan sebelum 58 tahun, tanpa uji kompetensi. Dokumen: SK KP, ijazah S-1/D-IV, serdik, surat pengalaman mengajar 2 tahun, hasil kinerja dua tahun terakhir minimal Baik. **Validasi substantif oleh petugas, bukan mesin.**
3. Proses internal: `DRAFT → SUBMITTED → VERIFIED → DISETUJUI_DINAS → DIKIRIM_BKPSDM → SK_TERBIT`; status perbaikan dapat dicatat oleh petugas. Penetapan SK memerlukan nomor, tanggal, dan salinan SK. Status `DIKIRIM_BKPSDM` ditandai petugas setelah tindakan administratif nyata, bukan otomatis.

## Rute aplikasi
- GTK masuk ke `Layanan Kepegawaian` → `Penyesuaian dan Pengangkatan JF Guru 2026`.
- Pemohon memakai NIP yang cocok dengan profil SIMANTAB, memilih tepat satu jalur dan mengunggah PDF/JPG/PNG dengan ukuran maksimum **1,5 MiB**.
- Petugas berotorisasi (`SUPER_ADMIN`, `KABID`, `KASI_SD`, `KASI_SMP`, `SUBKOOR_TK`, `STAFF_USUL_SK`, `STAFF_PROMOSI`) dapat memantau, meminta perbaikan, memverifikasi, mencatat pengiriman ke BKPSDM dan pengesahan SK.
- Rekap CSV bagi petugas **di-audit** di `jf2026_export_audit`; berkas menggunakan bucket privat `simantab-jf-guru-2026` dengan RLS dan URL bertenggat.
- Nama dan NIP hanya berada di database privat; tidak diletakkan dalam repo atau query logging yang tidak perlu.

## Urutan penerapan
1. **Backup** database produksi dan metadata storage. Pastikan tidak ada tabel/bucket nama sama dengan isi yang berbeda.
2. Review dan jalankan migrasi `supabase/migrations/20261020093000_jf_guru_2026_surat_0294.sql` melalui jalur migrasi resmi Supabase (staging disarankan).
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
