# SIMANTAB — Triage akun GTK pending dan rekonsiliasi NIP (21 Oktober 2026)

**Batas pendataan:** 26 Oktober 2026, pukul 23.59 WIB.  
**Lingkungan data yang diperiksa:** Supabase SIMANTAB-ONLINE (proyek `tizxfzvgglkokzvsiwkg`), aplikasi Cloudflare `simantab-cf-preview`.  
**Prinsip:** klasifikasi hanya membaca data; pengaktifan, penolakan, dan perubahan identitas wajib dilakukan Super Admin setelah verifikasi manual. Tidak ada penghapusan akun, dokumen, usulan, atau pemindahan data otomatis.

## Temuan saat audit (snapshot, bukan angka tetap)

| Antrean khusus channel GTK, approval_status=PENDING | Jumlah | Keputusan operasional |
| --- | ---: | --- |
| Verifikasi administrasi cepat | 37 | 26 pendaftar mengajukan peran KS (seluruh NPSN tercatat sebagai sekolah negeri aktif), 11 mengajukan peran GTK. Cocokkan identitas dan jabatan sebelum Setujui. |
| NIP berbenturan dengan akun **aktif-disetujui** | 13 | Tahan persetujuan, cocokkan pemilik NIP dan riwayat akun. Delapan pasangan terkait nama serupa; lima melibatkan varian nama. Jangan menyimpulkan akun identik dari NIP saja. |
| NIP ganda tanpa benturan akun aktif | 2 | Tentukan akun otentik melalui pemilik dan bukti administrasi; pertahankan histori. |
| Unit kerja kosong | 3 | Pemohon lengkapi unit kerja melalui profil sebelum verifikasi. |
| NIP kosong / perlu klarifikasi jenis kepegawaian | 2 | Jangan otomatis ditolak: bagi Pendamping Belajar/Pendamping Layanan Satuan Pendidikan, NIP ASN tidak relevan. Verifikasi kategori kepegawaian lebih dulu. |
| **Total** | **57** | Seluruhnya perlu keputusan individual. |

Cek tambahan: 12 kelompok NIP memiliki lebih dari satu akun **aktif** (25 akun aktif); secara keseluruhan 40 kelompok NIP 18 digit muncul berulang pada berbagai status. Audit ini sengaja memisahkan 68 pending channel DINAS (51 Operator SMP, 15 Operator Korwil, 2 peran lainnya). Jangan campur kanal DINAS dengan target GTK.

## Pelaksanaan aman di Super Admin

1. **Mulai dari 37 antrean bersih.** Buka *Persetujuan Akun KS/Pengawas/GTK*; cocokkan nama, NIP, unit kerja, dan peran dengan berkas/daftar resmi, khususnya bukti tugas KS. NPSN cocok tidak membuktikan bahwa pendaftar adalah kepala sekolah definitif.
2. **Tangani 13 benturan dengan akun aktif.** Audit NIP melalui fungsi `simantab_duplicate_nip_audit()` menggunakan sesi Super Admin, periksa kecocokan identitas, kegiatan login, usulan, dan dokumen. Jangan setujui akun kedua sebelum pemilik memastikan akun utama.
3. **Selesaikan 2 akun ganda antarpending.** Pemohon menunjuk akun utama yang benar; akun duplikat ditolak/dinonaktifkan melalui antarmuka yang diaudit, tanpa menghapus riwayat atau storage.
4. **Kembalikan 3 profil tanpa unit kerja dan 2 profil tanpa NIP untuk kelengkapan data.** NIP wajib diverifikasi bagi ASN; jangan memaksakan NIP ASN pada Pendamping Belajar/Pendamping Layanan Satuan Pendidikan.
5. **Audit ulang setelah setiap sesi**, dokumentasikan tindakan, alasan, pemeriksa dan timestamp. Jangan pernah memperbaiki benturan dengan menulis NIP fiktif atau mengubah NIP milik akun sah.
6. **Tutup paling lambat sebelum 26 Oktober 2026 pukul 23.59 WIB**; lakukan pemeriksaan akhir pada 25 dan 26 Oktober untuk memastikan yang belum selesai masuk antrean tindak lanjut, bukan hilang dari daftar.

## SQL pemeriksaan agregat read-only (telah diuji terhadap Supabase)

Kueri berikut **tidak** menampilkan nama, NIP penuh, email, maupun ID pemohon; aman untuk disimpan di repositori publik.

```sql
WITH normalized AS (
 SELECT id, approval_status, account_channel,
   regexp_replace(coalesce(nip,''),'[^0-9]','','g') AS nip_key,
   coalesce(nullif(btrim(unit_gtk),''),nullif(btrim(unit),'')) AS unit_kerja
 FROM public.profiles
), counts AS (
 SELECT nip_key,count(*) AS jumlah
 FROM normalized WHERE length(nip_key)=18
 GROUP BY nip_key
), queue AS (
 SELECT p.id,
 CASE
  WHEN length(p.nip_key)<>18 THEN 'PERIKSA_STATUS_DAN_NIP'
  WHEN coalesce(c.jumlah,0)>1 AND EXISTS (
    SELECT 1 FROM public.profiles other
    WHERE other.id<>p.id
      AND other.approval_status='APPROVED'
      AND other.is_active
      AND regexp_replace(coalesce(other.nip,''),'[^0-9]','','g')=p.nip_key
  ) THEN 'NIP_BENTUR_AKTIF'
  WHEN coalesce(c.jumlah,0)>1 THEN 'NIP_GANDA_TIDAK_AKTIF'
  WHEN p.unit_kerja IS NULL THEN 'LENGKAPI_UNIT'
  ELSE 'VERIFIKASI_ADMIN'
 END AS tindak_lanjut
 FROM normalized p LEFT JOIN counts c USING(nip_key)
 WHERE p.approval_status='PENDING' AND p.account_channel='GTK'
)
SELECT tindak_lanjut,count(*) AS jumlah
FROM queue GROUP BY tindak_lanjut ORDER BY tindak_lanjut;
```

### Larangan perubahan produksi otomatis

- Jangan menjalankan `UPDATE profiles SET approval_status='APPROVED'` secara massal.
- Jangan menghapus baris `auth.users`, `profiles`, `submissions`, `submission_files` atau objek Storage untuk melakukan deduplikasi.
- Jangan memberikan persetujuan peran `KEPALA_SEKOLAH`/`PENGAWAS` hanya berdasarkan kolom `requested_role` atau NPSN.
- Jangan mengunggah laporan bernama, NIP lengkap, email, nomor WA, atau credential ke repositori publik.
- Pastikan `approval_status` menggunakan nilai aktual uppercase (`PENDING`, `APPROVED`, `REJECTED`) dan pemisahan `account_channel='GTK'`.

**Status penerapan:** prosedur dan SQL audit disiapkan di branch; tidak ada mutasi database dan tidak ada deployment produksi dari dokumen ini.
