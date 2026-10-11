# Integrasi Multi-Usulan Operator — REVIEW ONLY

Status: **draft untuk tinjauan teknis; bukan fitur aktif, bukan migrasi siap deploy**.

## Keputusan kebutuhan

- **51 Operator SMP**: satu akun aktif per SMP Negeri, lingkup satu NPSN. Dapat mengirim beberapa usulan individual guru/KS di sekolah sendiri.
- **15 Operator Korwil**: satu akun aktif per kecamatan, lingkup SD Negeri pada kecamatan tersebut. Dapat mengirim beberapa usulan individual guru/KS.
- Layanan operator: `CUTI` dan `KGB`; diarahkan ke `STAFF_CUTI` dan `STAFF_KGB` dalam alur verifikasi dinas yang sudah ada.
- Pisahkan pengirim (`operator_id`) dari penerima hak layanan (`pemohon_nip`, `pemohon_nama`, `school_npsn`). Satu pemohon × layanan = satu pengajuan independen.
- Akun `qa_simantab_01` **tetap GTK** di produksi; perubahan role hanya setelah pengujian terisolasi dan penetapan resmi.

## Isi folder

- `authorization.mjs`: mesin aturan murni untuk memeriksa lingkup sekolah/wilayah dan routing, dipakai hanya untuk unit test.
- `authorization.test.mjs`: uji positif/negatif untuk kedua jenis operator dan anti-spoofing payload.
- `staging-gates.md`: prasyarat integrasi Supabase, RLS, storage, dan regresi.

## Cara uji mandiri

```sh
node --test review/operator-multi-usulan/authorization.test.mjs
```

Semua tes bersifat offline; tidak tersambung Supabase dan tidak membuat transaksi.

## Gate integrasi yang belum dipenuhi

1. **PostgreSQL lokal yang digunakan pada audit sebelumnya hanya `qa_`-tabel sederhana**; belum menjalankan migrasi Supabase asli, pengujian `auth.uid()` maupun RLS.
2. SQL draft dari paket sebelumnya **harus direview ulang**. Perubahan kebijakan KGB/Cuti berisiko memengaruhi pengajuan historis, fungsi `SECURITY DEFINER`, hak staf dan trigger lama. **Jangan memindahkan SQL draft ke `supabase/migrations` yang otomatis dijalankan.**
3. Jangan mengambil operator dari kolom teks request. Identitas operator harus berasal dari JWT Supabase (server `auth.uid()`) dan scope diverifikasi terhadap penugasan operator yang aktif.
4. Diperlukan **akun pengguna pilot dan data fiktif** pada staging Supabase yang benar-benar terisolasi, atau replika lokal Auth/Storage; PostgreSQL saja tidak mereplikasi semua layanan tersebut.
5. Seluruh flag pembuatan/pengiriman usulan **OFF** sampai uji integrasi E2E dinyatakan lulus dan pemilik layanan menyetujui persyaratan dokumen KGB.
6. Jangan ubah `web/package.json`, `web/build.mjs`, `main`, Vercel, atau project Supabase produksi dari branch review ini.

## Urutan implementasi selanjutnya

Review kontrak tabel dan API → uji DDL & RPC dalam database staging dengan data fiktif → autentikasi/RLS/storage → uji regresi seluruh layanan → pilot satu SMP dan satu Korwil → undangan operator berdasarkan SK → aktivasi bertahap 66 akun.

Audit lokal yang pernah dilaporkan: 7/7 skenario aturan wilayah lolos; **ini tidak setara uji RLS atau autentikasi produksi**.
