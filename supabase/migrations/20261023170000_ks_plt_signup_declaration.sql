-- Registrant-declared KS assignment. Never use this as an access-control role.
-- Approved school role continues to be KEPALA_SEKOLAH; definitive JF remains in SMART GTK.
alter table public.profiles add column if not exists ks_registration_status text
  not null default 'BELUM_DITETAPKAN';

do $$
begin
 if not exists (select 1 from pg_constraint
   where conrelid='public.profiles'::regclass
     and conname='profiles_ks_registration_status_check') then
  alter table public.profiles add constraint profiles_ks_registration_status_check
    check (ks_registration_status in ('BELUM_DITETAPKAN','DEFINITIF','PLT')
      and (ks_registration_status='BELUM_DITETAPKAN'
        or role='KEPALA_SEKOLAH'
        or requested_role='KEPALA_SEKOLAH'));
 end if;
end $$;

comment on column public.profiles.ks_registration_status is
 'Pernyataan pendaftar: KS definitif atau PNS (Plt.) KS. BUKAN perubahan jabatan definitif, bukan dasar pemberian role/akses; diverifikasi oleh Dinas dan dicatat terpisah dari SMART GTK.';

-- Keep existing profiles RLS and permissions. No automatic role approval
-- or modification to existing school_gtk_needs rows is performed here.
