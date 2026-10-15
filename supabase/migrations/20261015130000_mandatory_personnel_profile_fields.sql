-- SIMANTAB Cloudflare: wajib profil kepegawaian sebelum layanan.
-- Migrasi aditif, aman untuk layanan legacy Vercel yang menggunakan database bersama.
-- Nama, NIP, unit kerja, alamat, dan telepon sudah tersedia dalam public.profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pangkat text,
  ADD COLUMN IF NOT EXISTS golongan_ruang text;

COMMENT ON COLUMN public.profiles.pangkat IS
  'Pangkat ASN untuk Profil Wajib Lengkap SIMANTAB (diisi sendiri oleh akun terkait).';
COMMENT ON COLUMN public.profiles.golongan_ruang IS
  'Golongan/ruang ASN untuk Profil Wajib Lengkap SIMANTAB.';
