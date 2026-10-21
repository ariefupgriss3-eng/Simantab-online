# SIMANTAB SMART-GTK Massal — Pendaftaran Sederhana, Pendataan, dan Berkas Bertingkat

## Sasaran dan prinsip

Seluruh guru, kepala sekolah, pengawas, dan tenaga kependidikan dapat melengkapi data SIMANTAB. **Hanya guru dan kepala sekolah PNS** yang melalui skrining awal tiga jalur penyesuaian nomenklatur JF Guru, pengangkatan JF Guru, dan kebutuhan pemenuhan pendidikan S-1/D-IV. Hasil tidak otomatis menjadi pengajuan atau SK. PNS pengawas/tendik, PPPK, PPPK paruh waktu, serta non-ASN tetap menjadi database GTK.

**Alur GTK di HP:**

1. **Sudah punya akun → Masuk.** Jangan membuat akun ganda. Gunakan alamat email/username sendiri.
2. **Belum punya akun → Daftar GTK.** Nama lengkap, email pribadi aktif, password sendiri minimal delapan karakter sesuai sistem; konfirmasi email bila diminta dan tunggu persetujuan akun. Operator membantu panduan, bukan memegang password.
3. **Lupa password → pemulihan melalui email akun.** Jangan memakai password umum, NIP sebagai password, atau password yang dibagikan melalui WhatsApp.
4. Login, lengkapi Profil GTK (identitas/NIP jika ASN dan unit kerja), kemudian masuk **SMART-GTK**.
5. Pilih tugas utama (guru, kepala sekolah, pengawas, tendik), status kerja, dan pendidikan. GTK baru boleh melaporkan tugas sebenarnya meskipun admin belum menetapkan role khusus. **Pilihan ini hanya laporan mandiri dan tidak memberi hak akses Kepala Sekolah/Pengawas atau membuktikan jabatan secara hukum**; Dinas tetap memeriksa. Pertanyaan JF hanya muncul bagi **guru/KS PNS**. Data pendidikan yang telah tersimpan digunakan sebagai nilai awal.
6. **Simpan draf lebih dahulu.** Pengguna tidak perlu menentukan sendiri jenis usulan JF. Sistem menghitung skrining awal.
7. Lengkapi berkas sesuai kelompok, lalu tekan **Periksa Kelengkapan**. Bukti belum diverifikasi Dinas walaupun status "Berkas Lengkap" muncul.

## Persyaratan berkas berbasis status

| Kelompok | Analisis usulan JF Guru | Unggah dokumen | Kapan pendataan dinyatakan lengkap |
|---|---|---|---|
| PNS — Guru dan KS | Ya, 3 keluaran independen | **Wajib** sesuai jalur | Setelah seluruh dokumen yang relevan tercatat |
| PNS — Pengawas/Tendik | Tidak; database saja | Dokumen PNS dasar | Setelah dokumen PNS dasar tercatat |
| PPPK | Tidak; database saja | Opsional, yang dimiliki: SK PPPK, ijazah, serdik, surat tugas | Data sudah terisi; SK Jabfung tidak diwajibkan |
| PPPK paruh waktu | Tidak; database saja | Opsional, yang dimiliki: SK PPPK PW, ijazah, serdik, surat tugas | Data sudah terisi; SK Jabfung tidak diwajibkan |
| Non-ASN | Tidak; database saja | **Tidak ada unggah** | Data yang diminta telah terisi |

Daftar **dokumen PNS dasar** yang diterapkan pada tahap ini adalah SK Kenaikan Pangkat Terakhir dan Ijazah Terakhir. Jika terindikasi perlu penyesuaian nomenklatur dan mempunyai SK JF: tambahkan SK Jabfung terakhir. Jika terindikasi pengangkatan JF dari formasi PNS: tambahkan Sertifikat Pendidik, Surat Keterangan Pengalaman Mengajar minimal dua tahun, serta dokumen SKP tahun pertama dan kedua. **Daftar wajib ini harus ditelaah ulang oleh Dinas terhadap regulasi dan surat resmi sebelum aktivasi umum.** Jangan meminta dokumen tambahan yang tidak diperlukan.

Berkas privat: PDF/JPG/PNG maksimal **1,5 MB per berkas**; unggahan dibatasi ke folder UUID akun dan jenis dokumennya, dicatat dengan RPC, serta tercatat dalam audit. Bagi non-ASN, frontend tidak menyediakan input berkas dan backend menolak pendaftaran dokumen maupun unggahan ke bucket SMART-GTK. Tidak ada pembacaan lintas GTK. Data identitas dan dokumen tidak diumumkan di grup WhatsApp.

## Status proses GTK yang tidak menyesatkan

- **Belum terdaftar**: hanya dapat dihitung jika ada daftar induk GTK pembanding; SIMANTAB tidak mengetahui orang yang belum membuat akun dari database akun saja.
- **Sudah mendaftar, menunggu persetujuan / belum pernah login**: berasal dari akun yang benar-benar tercatat, bukan estimasi.
- **Draf**: profil kepegawaian/pendidikan bisa tersimpan sebelum file siap.
- **Data tercatat**: PPPK, PPPK PW, non-ASN dapat menyelesaikan tanpa memenuhi kewajiban berkas PNS.
- **Berkas PNS lengkap**: semua dokumen yang diwajibkan sistem telah tercatat, **bukan** dokumen diverifikasi, kelayakan JF, disposisi atau SK.
- **Perlu Data**: kondisi SK/formasi tidak pasti tetap ditandai, tidak dipaksa menjadi usulan.

Monitoring Kabid hanya menampilkan angka akun SIMANTAB terdaftar, aktif/disetujui, belum pernah login, mengisi SMART-GTK, dan status kelengkapan. **Total GTK yang belum daftar memerlukan daftar induk per NPSN/korwil**, agar angka tidak keliru.

## Aktivasi secara bertahap untuk ribuan GTK

- Mode `OFF`: semua penyimpanan SMART-GTK ditolak.
- Mode `PILOT`: hanya akun pada daftar pilot yang sudah ditetapkan petugas Dinas dapat mengisi.
- Mode `OPEN`: seluruh akun GTK aktif/disetujui yang sesuai role boleh mengisi; tidak perlu memasukkan ribuan akun ke allowlist satu per satu. Peralihan hanya melalui RPC pejabat Dinas, dengan audit sebelum/sesudah.
- Migrasi rollout **selalu mulai dari PILOT**. Mode OPEN **tidak diaktifkan otomatis** dengan deploy.
- Uji 5–10 peserta terlebih dahulu, termasuk PNS guru/KS, PPPK/PW, non-ASN, pengawas, dan tendik. Cocokkan hasil di Kabid. Sesudah lulus, lakukan pengenalan bertahap per satuan pendidikan/Korwil dan pantau beban email konfirmasi/auth agar tidak memicu limit penyedia.
- Gunakan operator satuan pendidikan untuk pendampingan dan rekonsiliasi identitas, tanpa menyimpan password GTK. NIP ganda diperiksa oleh admin; tidak digabung otomatis.
- Tidak membuat akun massal dengan password standar, tidak menonaktifkan verifikasi email atau persetujuan admin, dan tidak mengunggah dokumen fiktif.
- Perlu master GTK resmi untuk analisis cakupan **belum mendaftar** per sekolah; jangan memakai hitungan `profiles` untuk menyebut seluruh populasi Batang.

## Status implementasi saat dokumen ini ditulis

Kode frontend `smartgtk-unified.js?v=4` dan panduan pendaftaran `smartgtk-onboarding.js?v=1` tersedia pada cabang Draft PR #233, **bukan produksi**. Migrasi massal `20261021180000_smartgtk_mass_roles.sql`, `20261021181000_smartgtk_mass_documents.sql`, dan `20261021182000_smartgtk_mass_rollout_gate.sql` disiapkan untuk CI sintetik dan belum diterapkan pada Supabase produksi. Migrasi SMART-GTK versi pilot sebelumnya sudah ada di database aktif.

**Gerbang rilis:** audit dokumen wajib bersama pejabat Dinas; hasil tes Cloudflare & PostgreSQL hijau; uji dengan akun GTK/KS/Pengawas asli; pemeriksaan penyimpanan berkas; jalur rollback Worker; lalu minta persetujuan eksplisit sebelum menerapkan migrasi massal maupun mengaktifkan OPEN / deployment Cloudflare produksi.
