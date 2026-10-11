# Gerbang pengujian sebelum integrasi/aktivasi

**STATUS: BELUM SIAP PRODUKSI** — dokumen ini tidak mengubah aplikasi maupun database.

## Baseline produksi yang harus dipertahankan
- `public.profiles`: role teks, `account_channel`, `school_npsn`, status persetujuan. Belum tersedia 66 akun operator.
- `public.school_master`: 51 SMP Negeri aktif dengan NPSN unik, serta kolom `jenjang`, `school_status`, `kecamatan`.
- `public.submissions`: kepemilikan melalui `user_id`; `submission_files` memakai owner dan path unggahan; identitas pemohon yang diwakili belum tersimpan di sana.
- `private.route_submission_workflow`: `SUBMITTED` masuk `MENUNGGU_DISPOSISI_KOORDINATOR`, bukan langsung dianggap disetujui staf.
- `private.recommended_staff_role`: `KGB` → `STAFF_KGB`, `CUTI` → `STAFF_CUTI`. Sekolah SMP → `KASI_SMP`, Korwil SD → `KASI_SD`.
- RLS `submissions` saat ini memberi akses pemilik atau `private.is_dinas()`; penambahan operator memerlukan audit SELECT/INSERT/UPDATE/DELETE terhadap jalur REST dan SECURITY DEFINER.
- Jangan ubah jawaban dan skor BCKS, telemetri, pengajuan aktif, notifikasi lama, atau routing layanan lain.

## Checklist pra-integrasi
- [ ] Sinkronkan dan review DDL dari paket v2 di *database staging anonim*; file SQL paket lama masih **DRAFT_NOT_FOR_PRODUCTION**, jangan langsung dipakai.
- [ ] Periksa setiap penggunaan `auth.uid()`, `SECURITY DEFINER`, `search_path`, grant EXECUTE, RLS, dan pemilihan akun scope dari tabel penugasan di server.
- [ ] Aturan NPSN/korwil tidak boleh ditentukan dari field username atau scope yang dapat dikirim bebas oleh klien.
- [ ] Pembatasan server `OPERATOR_SMP` per NPSN dan `OPERATOR_KORWIL` khusus SD Negeri per kecamatan, dengan role yang benar dan flag penugasan aktif.
- [ ] Identitas pemohon nama/NIP/jabatan/NPSN disimpan terpisah dari operator pengirim dan memiliki jejak audit.
- [ ] Pembuatan draft, unggah dokumen, kirim, revisi, dan status tetap satu transaksi/usulan per pemohon; kirim kolektif tidak berarti satu submission untuk banyak orang.
- [ ] Verifikasi daftar berkas Cuti dan KGB secara administratif (KGB pada paket awal masih provisional).
- [ ] Uji bahwa dokumen Storage tidak bocor lintas NPSN/operator dan 500 KB per file sesuai aturan aplikasi.
- [ ] Integrasikan dengan login GTK, navigasi operator, tombol pengajuan, daftar pemohon, daftar status, dan profil akun; pastikan staf dinas tetap bisa verifikasi.
- [ ] Lakukan uji regresi semua layanan aktif, terutama CUTI/KGB historis dan `submission_gtk_response`.
- [ ] Jalankan tes negatif REST/RPC: spoofing operator_id, cross-NPSN, cross-kecamatan, status injection, delete, mass assignment, collision, race condition.
- [ ] Jalankan uji E2E dengan akun operator nyata khusus staging dan data fiktif, termasuk log out/in dan perpindahan akun.
- [ ] Penetapan pejabat operator, email unik, SK tugas, aktivasi terbatas; **jangan** buat 66 akun dengan password seragam.
- [ ] Pilot satu SMP Negeri dan satu Korwil, kemudian rollout bertahap setelah dinyatakan lulus.

## Kebijakan perubahan
Tidak otomatis menambahkan file review ini ke build `web/package.json`. Jangan merge cabang review atau menjalankan SQL pada Supabase produksi sebelum audit, backup, dan persetujuan eksplisit.

## Bukti yang masih dibutuhkan
- Log SQL staging dan 7+ uji kasus otorisasi.
- Bukti bahwa RLS mencegah login user lain membaca/mengubah pengajuan.
- Bukti bahwa operator tidak dapat menyetujui usulan.
- Bukti regresi layanan produksi lama.
- Hasil pengujian multi-pemohon untuk 51 NPSN SMP dan 15 kecamatan Korwil.
