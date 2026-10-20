# SMART-GTK — Satu Formulir, Tiga Analisis (versi 1)

**Tujuan:** GTK hanya melaporkan satu set data faktual. SIMANTAB melakukan skrining awal secara otomatis untuk tiga tindak lanjut yang bisa saling beririsan.

## 1. Satu formulir untuk semua GTK

Identitas (nama, NIP, unit kerja) diambil dari akun GTK aktif/disetujui; tidak diketik ulang. Setiap GTK mengisi:
1. Status kepegawaian: PNS, PPPK, PPPK paruh waktu, non-ASN, atau lainnya.
2. Kepemilikan SK JF Guru: ya/tidak/belum tahu.
3. Jabatan pada SK jika ada: Guru Pertama/Muda/Madya; Guru Ahli Pertama/Muda/Madya; atau lainnya.
4. Apakah SK JF menggunakan nomenklatur baru: ya/tidak/belum tahu/tidak berlaku.
5. Apakah formasi awal pengangkatan PNS adalah JF Guru: ya/tidak/belum tahu.
6. Pendidikan tertinggi sesuai ijazah: SLTA, SPG, D-I, D-II, D-III, S-1, D-IV, S-2, S-3.
7. Status pendidikan: belum melanjutkan, sedang kuliah, lulus belum diverifikasi, atau sudah S-1/D-IV atau lebih tinggi.
8. Perguruan tinggi, program studi, tahun mulai, target kelulusan, tanggal lulus, dan catatan — diisi menurut relevansi.

Data pendidikan yang sebelumnya dimasukkan ke `jf2030_qualification` digunakan sebagai nilai awal dan disinkronkan dalam **satu transaksi RPC**, tanpa memaksa pengguna mengulang. Bukti ijazah **tidak wajib diunggah saat pertama mengisi**. Status verifikasi ijazah yang sudah dikunci tidak diturunkan oleh GTK.

## 2. Logika tiga keluaran independen

| Keluaran | Indikasi awal | Kehati-hatian |
|---|---|---|
| **Penyesuaian nomenklatur JF Guru** | PNS, ada SK JF, nomenklatur belum diperbarui, nama jabatan pada SK terisi. | Belum tahu/missing -> **Perlu Data**. Jika sudah disesuaikan -> Tidak terindikasi. |
| **Pengangkatan JF Guru** | PNS, belum ada SK JF, formasi awal PNS JF Guru, pendidikan S-1/D-IV atau lebih tinggi. | Pendidikan di bawah S-1/D-IV -> **Tertahan Kualifikasi**; data SK/formasi tidak jelas -> Perlu Data. Bukti formasi dan syarat lain harus diverifikasi. |
| **Pemenuhan kualifikasi S-1/D-IV** | D-I/D-II/D-III: arah pembinaan dengan tenggat 11 Mei 2030. SLTA/SPG: telaah khusus. | S-1/D-IV/S-2/S-3 dicatat **berdasarkan pernyataan GTK**, bukan otomatis ijazah terverifikasi. |

Setiap keluaran berbasis data faktual yang tersimpan di Supabase, fungsi `smartgtk_classify` di backend. Satu guru boleh memenuhi dua kategori, misalnya nomenklatur + pendidikan. Kategori ini adalah **potensi tindak lanjut**, **BUKAN** keputusan administratif, kepastian kelayakan hukum, persetujuan BKPSDM atau SK.

Pedoman harus ditelaah kembali berdasarkan Surat Dirjen GTK Nomor 0294/B/B.B1/HK.07.00/2026 tanggal 27 Juli 2026 dan PermenPANRB 7/2026 sebelum menerima usulan resmi. Pemeriksaan berkas oleh petugas tetap diwajibkan.

## 3. Tata kelola akses dan privasi

- Backend `public.smartgtk_save` hanya untuk akun jalur GTK yang aktif/disetujui dan memiliki NIP 18 digit. Sistem menolak **NIP yang sama digunakan lebih dari satu akun aktif**: hanya administrator dapat merekonsiliasi.
- Tabel `smartgtk_intake` dan `smartgtk_audit` RLS: GTK hanya membaca miliknya; pejabat Dinas yang berwenang memiliki monitoring. Insert/update/delete langsung ditolak; perubahan melalui fungsi resmi dengan jejak audit.
- Petugas memakai `smartgtk_officer_list`, maksimal 50 laporan per halaman; rekap yang tampil hanya jumlah per halaman, bukan statistik seluruh GTK Kabupaten Batang.
- Penyimpanan tidak otomatis mengajukan `jf2026_submit_case`, menyetujui dokumen, mengubah status kepegawaian atau menerbitkan SK.
- Skrining data awal tidak cukup untuk menilai sertifikat pendidik, pengalaman, SKP, umur, dan persyaratan lain yang bergantung pada regulasi. Penetapan tindak lanjut tetap di Dinas.

## 4. Transisi dari dua formulir lama

- Pada akun GTK, satu kartu **SMART-GTK** menggantikan kartu input awal JF Guru 2026 dan Pendidikan 2030. Kedua modul sebelumnya tetap ada di kode sehingga dokumen pendidikan dapat diunggah **setelah** pengisian serta petugas masih dapat mengelola kasus yang sudah diajukan.
- Pada akun Dinas, layanan historis tetap tersedia ditambah ringkasan SMART-GTK.
- Profil lama dan usulan Jabfung yang telah `SUBMITTED` **tidak dihapus** atau dikonversi otomatis.
- Pengujian PostgreSQL hanya menggunakan **data sintetis**. CI memeriksa klasifikasi tiga jalur, dua kategori sekaligus, pengamanan akun DINAS/GTK dan NIP ganda.

## 5. Status rilis

**PR #233 tetap Draft.** Migrasi `supabase/migrations/20261021150000_smartgtk_unified_intake.sql` **belum dipasang pada database produksi**. Build Cloudflare QA bukan bukti deploy produksi. Selesaikan tinjauan hukum, uji preview runtime (dengan database yang memiliki migrasi baru), tinjauan kemudahan isian di Android, dan prosedur rollback sebelum izin penerapan skema dan deployment Worker yang benar.

Ketika kelak diaktifkan, staf dapat meneruskan hasil skrining tertentu ke proses usulan resmi lewat tombol tindakan yang memerlukan pengecekan dokumen, **bukan membuat usulan otomatis dari jawaban survei**.
