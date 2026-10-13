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
- **Frontend produksi aktif**: pada 13 Oktober 2026, bukan lewat merge/rekonstruksi seluruh frontend tetapi lewat **project-level Vercel route rewrite** yang hanya memetakan URL `/submission-layered-workflow.js` ke sumber tersemat commit GitHub `f02bce8653b682cf4975c1b23b46a85cda075da2` melalui jsDelivr CDN. Versi HTML utama tetap mengunduh `submission-layered-workflow.js?v=11` tetapi respons sekarang berupa modul Kabid versi 11. Routing rule ID `78f502d0-56ed-4854-9d68-5f995535707a`, Vercel routes version `0dd0cb93-3b37-42d5-87e9-a44f1197a3a0`, `staged=false`.
- **Pemeriksaan**: staging mengembalikan HTTP 200, berkas JS sesuai **persis** dengan GitHub commit `f02bce...` dan valid sintaks JavaScript. Produksi mengembalikan HTTP 200 dengan marker `SIMANTAB_KABID_SERVICE_ASSIGNMENT_V1_20261013`; URL versi unik juga cocok. Skrip staf `staff-assigned-services.js?v=9` tidak berubah; endpoint Jabfung `/api/jabfung-ai-read` tetap HTTP 410. Deployment pokok masih `dpl_8LpSihFq89LDHmbFJbjHQJjqyT9Q` (tidak dibangun ulang).
- **Catatan ketersediaan**: percobaan membuat deployment Vercel preview satu berkas ditolak `HTTP 402 resource_creation_blocked` karena saldo tertunggak akun/tim. Tidak ada pembayaran, paket/plan, environment variable, atau deployment baru yang dibuat. Routing aktif saat ini tergantung jsDelivr CDN sebagai upstream, sehingga pin commit bukan pengganti ketersediaan layanan upstream.
- **Batas validasi**: belum memakai akun Kabid sesungguhnya dan **belum menjalankan transaksi penugasan nyata**. Bila aplikasi PWA menyimpan skrip lama, perlu tutup-buka/refresh agar pemuatan modul diperbarui.

## Rollback
**Rollback tampilan saja (prioritas)**: kembalikan Vercel project routes ke versi sebelumnya `eee585a4-11b9-4529-8368-1bd7877d60fd`, yang memiliki **hanya** pemblokiran AI Jabfung HTTP 410; tidak mengubah deployment utama. Pastikan status rute aktif dan URL modul kembali ke versi semula. Agar tombol pembagian tugas Kabid tetap berfungsi setelah rollback tampilan, perlu pemasangan frontend yang aman terlebih dahulu. **Rollback izin server** hanya bila diharuskan oleh insiden: pulihkan definisi dua RPC dari kondisi sebelum migrasi, tanpa menghapus catatan penugasan atau data usulan.

## Batas validasi
Verifikasi fungsi dilakukan dengan membaca definisi server tanpa memanggil RPC memakai identitas pengguna maupun mengubah usulan sungguhan. Login dan transaksi penugasan Kabid belum diuji menggunakan akun nyata. Fitur UI kini aktif melalui Vercel route rewrite, **bukan** deployment baru; verifikasi sintaks, konten, dan respons HTTP tidak menggantikan uji kewenangan dari sesi autentikasi.
