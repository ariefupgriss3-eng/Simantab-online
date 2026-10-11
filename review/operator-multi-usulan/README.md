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

## Integrasi pratinjau di cabang review (12 Oktober 2026)

Kode pada `web/operator-multi-usulan-preview.js` adalah **demo tanpa jaringan**. Form menyediakan pilihan Operator SMP dan Korwil, banyak pemohon fiktif, deduplikasi per NIP+NPSN+layanan, validasi kewenangan, dan rute Cuti/KGB. Semua data di memori browser dan hilang saat halaman ditutup. Tidak ada upload, RPC, atau update Supabase.

- Satu file pratinjau mandiri: [`preview-offline.html`](./preview-offline.html). Unduh lalu buka dengan Chrome/Edge pada Windows 11. Pilih Operator SMP atau Korwil; tidak diperlukan akun dan tidak ada layanan internet.
- Integrasi bertahap pada rangkaian build cabang review: `web/package.json` kini memanggil `web/inject-operator-multi-usulan-preview.mjs` **paling akhir**. Tanpa `SIMANTAB_OPERATOR_QA_PREVIEW=1`, skrip tidak mengubah HTML maupun menambahkan aset.
- Dengan flag QA, modul dipasang setelah sesi profil operator tersedia, tetapi **masih hanya pratinjau tanpa backend** dan diberi banner "SIMULASI — TIDAK TERKIRIM". Jangan memakai flag ini pada Vercel produksi.
- Akun produksi `qa_simantab_01` masih **GTK** sehingga tidak disulap menjadi operator oleh flag. Pengujian login operator pada staging membutuhkan profil/penugasan operator fiktif yang sah.
- Unit test: `node --test review/operator-multi-usulan/authorization.test.mjs review/operator-multi-usulan/preview-smoke.test.mjs`.
- SQL kandidat v2 sebelumnya belum digabungkan menjadi migrasi karena audit RLS, trigger, storage, dan regresi belum lulus di staging.

**Uji yang sudah dilakukan dalam audit percakapan:** 17 pemeriksaan fungsi cakupan, 13 simulasi interaksi pratinjau, 5 pemeriksaan flag build; semuanya lulus di lingkungan pemeriksaan terisolasi. Ini **bukan** bukti bahwa database Supabase/auth/storage atau deployment Vercel sudah teruji.

## Backend DRAFT-only — perkembangan 12 Oktober 2026

- `01-staging-schema-RPC-DRAFT-DO-NOT-DEPLOY.sql`: **belum dijalankan**. Dipakai setelah ada *Supabase staging* yang benar-benar terisolasi. Mencakup penugasan per NPSN/kecamatan, identitas guru/KS, dan RPC `operator_create_draft` dengan `auth.uid()`, role operator, persyaratan status DRAFT, enam subtype Cuti, serta pemetaan KGB/Cuti.
- `operator-staging-rpc-adapter.mjs`: adaptor untuk calon integrasi staging, mengirim hanya payload pemohon yang diperlukan, **tidak mengirim identitas operator, status, atau persetujuan dari browser**. Modul ini belum disertakan ke build aplikasi.
- `operator-staging-rpc-adapter.test.mjs`: pengujian mock murni yang tidak terhubung ke database.
- `audit-backend-2026-10-12.md`: hasil audit read-only terhadap kebijakan RLS dan alur produksi. Data aktif: 51 SMP Negeri, 445 SD Negeri, 15 kecamatan.
- **Belum ada RPC untuk mengirim usulan resmi**. Formulir Cuti memiliki enam subtype di kode frontend, tetapi katalog `service_requirements` untuk Cuti/KGB tidak berisi entri; kelengkapan KGB juga belum ditetapkan pada layanan server.
- Sebelum aktivasi harus mengunci akses langsung Cuti/KGB dari akun GTK dan KS biasa **bersamaan dengan** penggantian formulir, tanpa memutus usulan historis dan alur staf.

Tidak ada perubahan pada `main`, pengguna produksi, Supabase, ataupun Vercel. Build cabang review tetap menonaktifkan QA preview secara default.
