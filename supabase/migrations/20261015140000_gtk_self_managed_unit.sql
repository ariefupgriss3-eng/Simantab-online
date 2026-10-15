-- GTK mengisi unit kerja secara mandiri tanpa mengubah field penetapan peran/akses.
-- Kolom profiles.unit lama dipertahankan untuk kompatibilitas aplikasi lama.
-- Tampilan Profil Cloudflare mengutamakan unit_gtk, lalu fallback ke unit lama.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unit_gtk text;

COMMENT ON COLUMN public.profiles.unit_gtk IS
  'Unit kerja yang diisi sendiri oleh GTK/KS/Pengawas pada Profil Wajib SIMANTAB; informasi profil, bukan pembaruan role, NPSN atau akses sekolah.';
