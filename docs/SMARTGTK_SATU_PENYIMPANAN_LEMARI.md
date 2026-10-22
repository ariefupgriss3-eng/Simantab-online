# SMART-GTK → Lemari Dokumenku: satu penyimpanan fisik

**Status 21 Oktober 2026:** migrasi `smartgtk_one_lemari_storage_20261021` berhasil dipasang di Supabase aktif, dan perubahan frontend berada di Cloudflare Preview PR #233 (Draft). Frontend produksi belum dirilis, mode rollout tetap **PILOT**.

## Perubahan
- Saat GTK memilih **Unggah ke Lemari Dokumenku**, berkas PDF/JPG/PNG maksimum 1,5 MB tersimpan satu kali di bucket privat `simantab-documents` pada path `<UUID_PEMILIK>/SMARTGTK/<UUID_BERKAS>.<ext>`.
- Setelah upload, RPC `smartgtk_locker_register` memverifikasi akun, jenis dokumen, kepemilikan path, status pilot, ukuran, MIME dan keberadaan objek. RPC membuat metadata arsip `smartgtk_locker_files` sekaligus tautan persyaratan `smartgtk_documents` **dalam satu transaksi**.
- Menu **Lemari Dokumenku** menampilkan gabungan berkas pengajuan lama (`submission_files`) dan arsip mandiri SMART-GTK (`smartgtk_locker_files`) tanpa membuat usulan pelayanan fiktif.
- Kandidat **Ambil dari Lemari Dokumenku** membaca kedua jenis metadata, memfilter berdasarkan akun, kode dokumen sesuai persyaratan, ukuran dan keberadaan objek.
- Status kelengkapan PNS dan monitoring Dinas dapat menghitung tautan dari arsip baru maupun dokumen lama. Berkas yang hilang dari Storage tidak dianggap lengkap.
- Dokumen yang telah tersimpan di bucket lama `simantab-smartgtk-private` **tidak dihapus atau dipindahkan**; masih dikenali untuk kompatibilitas. Unggahan **baru dari UI SMART-GTK** menuju Lemari Dokumenku.
- Non-ASN tidak mendapat akses unggah; PPPK/PW opsional; PNS sesuai berkas wajib yang berlaku. Status `BERKAS_LENGKAP` bukan pengesahan SK atau hasil verifikasi Dinas.

## Pemeriksaan
- GitHub Actions Cloudflare Bundle + PostgreSQL Security **lulus** pada commit `d69caf6dc8befd6b7a9b18334f334ba8e41f5eea`, termasuk tes penyimpanan satu objek, rekam audit, isolasi antar akun dan penolakan metadata ukuran palsu.
- Sesudah migrasi: 486 profil, 1 formulir SMART-GTK, 2.210 berkas layanan lama, 0 arsip baru dan 0 referensi berkas SMART-GTK. Mode PILOT tetap aktif.
- RLS pada `smartgtk_locker_files` aktif; akses anonymous ditolak, INSERT langsung oleh GTK ditolak dan harus melalui RPC. Bucket `simantab-documents` tetap privat.
- **Belum ada uji upload dokumen nyata melalui browser**. Periksa tombol SMART-GTK `Unggah ke Lemari Dokumenku`, status dokumen dan kemunculan di Lemari Dokumenku setelah uji.
- **Jangan aktifkan OPEN atau merge PR #233 ke produksi** sampai pemeriksaan UI, audit dokumen, kapasitas dan regresi layanan lama selesai.
