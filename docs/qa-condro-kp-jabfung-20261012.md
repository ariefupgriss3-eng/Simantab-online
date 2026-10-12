# QA GATE — Admin Tambahan KP dan e-Jabfung (Condro)

**Target:** SIMANTAB-ONLINE, akun yang telah disetujui untuk tugas tambahan.  
**Peran utama:** `SUBKOOR_TK` tetap.  
**Capability:** `KP` dan `E_JABFUNG` pada `team_task_assignments`.  
**Status 12 Oktober 2026:** *Kode pada PR #168; migrasi RPC belum diterapkan ke produksi.*

## Aturan pengujian
- Gunakan Supabase dan akun penguji **terpisah dari produksi**. Jangan menguji INSERT/UPDATE/DELETE dengan akun riil di produksi.
- Pengujian dengan Supabase Production hanya **read-only** untuk metadata, karena Vercel preview bisa memakai kredensial/proyek Supabase produksi.
- Jangan merekam nama, NIP, password, atau dokumen riil dalam laporan QA; gunakan data sintetis.
- Reviewer yang memvalidasi akses harus berbeda dari admin yang menyusun respons.

## Matriks uji E2E (semua wajib lulus sebelum rilis)
| ID | Aktor dan kondisi | Operasi | Hasil yang diharapkan |
|---|---|---|---|
| C01 | Condro login, role SUBKOOR_TK; tugas KP + E_JABFUNG aktif | Buka menu | Menu Subkoor TK tetap muncul; menu **Admin KP / Jabfung** tambahan muncul |
| C02 | Condro tanpa capability KP/e-Jabfung | Buka menu | Menu admin tambahan tidak muncul |
| C03 | Condro tugas KP aktif | Kasi/Subkoor sah memilih petugas KP | Condro muncul bersama admin existing, tidak menggantikan Kasim/Risna |
| C04 | Condro tugas e-Jabfung aktif | Kasi/Subkoor sah memilih petugas Jabfung | Condro tersedia sebagai kandidat |
| C05 | Condro hanya tugas KP/e-Jabfung | Kasi/Subkoor memilih petugas CUTI/KGB | Condro **tidak** muncul |
| C06 | Condro belum mendapat penugasan pengajuan tertentu | Buka tautan detail pengajuan orang lain | Ditolak oleh modul; otorisasi server untuk tindakan juga menolak |
| C07 | Condro ditugaskan KP/e-Jabfung | Simpan respons melalui RPC `submission_staff_respond` | Tercatat sebagai respons staf, menuju approval Kasi/Subkoor |
| C08 | Condro menyusun respons untuk pengajuan TK/PAUD dan berperan Subkoor TK | Coba `submission_coordinator_approve` sebagai Condro | **Ditolak** dengan pesan larangan persetujuan sendiri |
| C09 | Pejabat berbeda yang sah (mis. Super Admin tanpa konflik kepentingan) | Review/approve respons TK yang dikerjakan Condro | Bisa menurut batasan peran dan status; tercatat pada audit |
| C10 | Kabid | Persetujuan akhir setelah approval koordinator | Hanya Kabid/Super Admin sesuai aturan, notifikasi dan status konsisten |
| C11 | Kasim dan Risna Afif | Memproses pengajuan KP/Jabfung masing-masing | Tidak ada regresi |
| C12 | Condro keluar, akun pengguna lain masuk pada perangkat sama | Pergantian akun | Menu tambahan Condro dihapus, tidak ada data bocor dari sesi lama |
| C13 | Pengawas/Korwil/pemohon | Mencoba lihat tugas dan respons admin orang lain | Ditolak sesuai scope; tidak mendapat menu tambahan |
| C14 | Admin yang tidak berwenang | Panggil RPC penyusunan respons tanpa penugasan | Ditolak di server |
| C15 | Condro sudah ditugaskan, capability kemudian dinonaktifkan | Respons/bagi tugas baru | RPC harus menolak, menu hanya tampil jika capability aktif |
| C16 | Pemohon riil tidak digunakan | Uji berkas sintetis pada bucket uji | Unduh hanya untuk yang berwenang; tidak mengubah file produksi |

## Urutan deploy produksi sesudah E2E lulus
1. Catat versi produksi aktif, snapshot definisi 4 RPC, dan jumlah data (read-only).
2. Terapkan **migrasi 4 RPC** terjaga checksum secara transaksional.
3. Periksa definisi dan uji otorisasi login yang sesuai; bila bermasalah jalankan rollback fungsi.
4. Gabungkan PR #168 setelah migrasi siap dan aturan deploy GitHub→Vercel dipahami.
5. Pantau Vercel preview/production, kasuistik penugasan, respons staf, dan persetujuan minimal satu siklus sintetis nonproduksi dahulu.
6. Jika UI bermasalah, rollback versi Vercel; jika RPC bermasalah, jalankan rollback DB setelah pemeriksaan drift.

## CI status
Workflow `Condro KP-Jabfung security regression` (GitHub Actions) memeriksa sintaks JS serta logika source. CI lulus bukan pengganti 16 skenario E2E dengan sesi login/JWT.

## Status gerbang rilis
- [x] Penugasan Condro di database produksi (2 capability) — telah dilakukan pada tahap sebelumnya
- [x] Perubahan UI dan fungsi RPC dirancang di branch terpisah
- [x] Kontrol anti-self-approval dirancang
- [x] CI kode berhasil
- [ ] Lingkungan Supabase nonproduksi tersedia
- [ ] 16 uji E2E lintas peran lulus
- [ ] Review penanggung jawab keamanan/layanan
- [ ] Persetujuan terpisah untuk migrasi RPC dan merge/deploy produksi
