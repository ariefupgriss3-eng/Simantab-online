# SIMANTAB-ONLINE — Akses Pembagian Tugas Layanan untuk Kabid
**13 Oktober 2026**

## Keputusan kewenangan
- **KABID** boleh menugaskan admin/staf Dinas yang aktif untuk semua jenjang: TK/PAUD/PNF, SD, dan SMP, baik satu usulan maupun pembagian agregat.
- **KASI_SD, KASI_SMP, SUBKOOR_TK** tetap hanya mengelola usulan sesuai kewenangan jenjang masing-masing.
- **SUPER_ADMIN** tetap memiliki wewenang semula; **Kepala Dinas/Sekdin** memantau tanpa memperoleh izin baru untuk membagi tugas.
- **GTK dan staf biasa** tidak dapat memperluas kewenangan penugasan. Status verifikasi, persetujuan akhir, dan data berkas tidak berubah.

## Pengaman
Fungsi `submission_assign_staff_multi` dan `submission_assign_staff_balanced` tetap menjadi pemeriksa otorisasi server. Perubahan terbatas pada tambahan pengecualian `KABID` dalam pemeriksaan peran yang sudah ada. Kedua RPC tetap memeriksa:
1. Tahap usulan `MENUNGGU_DISPOSISI_KOORDINATOR`.
2. Penerima tugas memiliki akun Dinas aktif dengan peran `STAFF_*` atau `ADMIN_*`.
3. Untuk batch, jenis layanan, jenjang dan koordinator harus seragam.
4. Mencatat pelaksana dan waktu penugasan serta mengirim notifikasi.

## Penerapan
- **Supabase produksi**: migrasi `kabid_service_assignment_20261013` berhasil diterapkan pada 13 Oktober 2026. Pemeriksaan baca-saja terhadap kedua definisi RPC telah mengonfirmasi pengecualian Kabid, pemeriksaan autentikasi serta verifikasi penerima tugas.
- **Frontend**: perubahan berada pada `web/submission-layered-workflow.js` dalam cabang `feat/kabid-service-assignment-20261013`. Menambahkan panel **Pembagian Tugas Layanan — Seluruh Jenjang** di menu Monitoring untuk Kabid. Tombol satu usulan, pembagian batch satu jenjang+layanan, dan refresh pasca-penugasan diatur dengan guard peran+status.
- **Belum dideploy**: frontend produksi SIMANTAB belum berubah. Halaman produksi mengeksekusi `submission-layered-workflow.js?v=11` dari deployment `dpl_8LpSihFq89LDHmbFJbjHQJjqyT9Q`. Build saat ini menyusun ulang banyak layanan; tidak boleh langsung merge/deploy semua tanpa audit kompatibilitas agar modul lain tidak terganggu.

## Rollback
Jika diperlukan, kembalikan dua definisi RPC tepat ke kondisi sebelumnya (peran hanya `SUPER_ADMIN` atau koordinator terkait) menggunakan salinan definisi dalam riwayat Supabase sebelum penerapan. Jangan menghapus/mengubah baris usulan atau catatan penugasan.

## Batas validasi
Verifikasi fungsi dilakukan dengan membaca definisi server tanpa memanggil RPC memakai identitas pengguna maupun mengubah usulan sungguhan. Login dan tombol frontend Kabid belum diuji pada deployment produksi baru. Jangan menyebut fitur UI sudah aktif hingga deployment spesifik selesai dan diperiksa.
