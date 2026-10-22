-- SMART-GTK controlled pilot. No roster is assigned automatically.
-- Fail-closed: only explicitly approved pilot GTK may call smartgtk_save.
create table if not exists public.smartgtk_pilot_users(
 owner_id uuid primary key references auth.users(id),
 enabled boolean not null default true,
 assigned_by uuid not null references auth.users(id),
 assigned_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.smartgtk_pilot_users enable row level security;
revoke all on public.smartgtk_pilot_users from public,anon,authenticated;
-- Members can only discover whether they are enrolled, via a scoped RPC.
create or replace function public.smartgtk_pilot_status()
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and exists(
  select 1 from public.smartgtk_pilot_users t
  join public.profiles p on p.id=t.owner_id
  where t.owner_id=auth.uid() and t.enabled=true
    and p.account_channel='GTK' and p.is_active=true and p.approval_status='APPROVED'
 );
$$;
revoke all on function public.smartgtk_pilot_status() from public,anon;
grant execute on function public.smartgtk_pilot_status() to authenticated;

create or replace function public.smartgtk_pilot_assign(p_target uuid,p_enabled boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not private.jf2026_is_officer() then
  raise exception 'Hanya petugas Dinas berwenang yang boleh menetapkan pilot';end if;
 if p_target is null or p_enabled is null then raise exception 'Data penetapan pilot tidak lengkap';end if;
 if not exists(select 1 from public.profiles
  where id=p_target and account_channel='GTK' and is_active=true
    and approval_status='APPROVED') then
  raise exception 'Peserta pilot harus akun GTK yang aktif/disetujui';end if;
 insert into public.smartgtk_pilot_users(owner_id,enabled,assigned_by)
 values(p_target,p_enabled,auth.uid())
 on conflict(owner_id) do update
 set enabled=excluded.enabled,assigned_by=excluded.assigned_by,updated_at=now();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(p_target,auth.uid(),case when p_enabled then 'PILOT_ENABLED' else 'PILOT_DISABLED' end);
end;
$$;
revoke all on function public.smartgtk_pilot_assign(uuid,boolean) from public,anon;
grant execute on function public.smartgtk_pilot_assign(uuid,boolean) to authenticated;

create or replace function public.smartgtk_save(
 p_employment text,p_jf_sk text,p_old_position text,p_nomenclature_updated text,
 p_pns_jf_formation text,p_education text,p_study_status text,
 p_university text,p_program text,p_start_year integer,p_target_graduation date,
 p_graduation_date date,p_notes text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_profile public.profiles%rowtype; v_existing public.jf2030_qualification%rowtype;
        v_result jsonb;
begin
 select * into v_profile from public.profiles where id=auth.uid()
 and account_channel='GTK' and approval_status='APPROVED' and is_active=true;
 if not found then raise exception 'Hanya akun GTK aktif/disetujui yang dapat mengisi'; end if;
 -- Pilot restriction is checked SERVER-SIDE, not inferred from frontend visibility.
 if not exists(select 1 from public.smartgtk_pilot_users g
     where g.owner_id=auth.uid() and g.enabled=true) then
  raise exception 'SMART-GTK masih uji coba terbatas; akun belum masuk peserta pilot';
 end if;
 if p_employment in ('PNS','PPPK','PPPK_PW') and coalesce(v_profile.nip,'') !~ '^[0-9]{18}$' then
  raise exception 'GTK ASN harus melengkapi NIP 18 digit di Profil GTK terlebih dahulu';
 end if;
 if coalesce(v_profile.nip,'') ~ '^[0-9]{18}$' and (select count(*) from public.profiles
     where account_channel='GTK' and is_active=true and approval_status='APPROVED'
       and nip=v_profile.nip)>1 then
  raise exception 'NIP terhubung dengan lebih dari satu akun aktif. Hubungi admin untuk rekonsiliasi.';
 end if;
 if p_employment is null or p_employment not in ('PNS','PPPK','PPPK_PW','NON_ASN','LAINNYA')
 or p_jf_sk is null or p_jf_sk not in ('YA','TIDAK','BELUM_TAHU')
 or p_nomenclature_updated is null or p_nomenclature_updated not in ('YA','TIDAK','BELUM_TAHU','TIDAK_BERLAKU')
 or p_pns_jf_formation is null or p_pns_jf_formation not in ('YA','TIDAK','BELUM_TAHU')
 or p_education is null or p_education not in ('SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3')
 or p_study_status is null or p_study_status not in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
 or (p_education in ('S1','DIV','S2','S3') and p_study_status<>'SUDAH_MEMENUHI')
 or (p_education in ('SLTA','SPG','DI','DII','DIII') and p_study_status='SUDAH_MEMENUHI')
 then raise exception 'Isian status atau pendidikan tidak sesuai'; end if;
 if length(coalesce(p_old_position,''))>160 or length(coalesce(p_university,''))>200
 or length(coalesce(p_program,''))>200 or length(coalesce(p_notes,''))>2000
 then raise exception 'Teks isian terlalu panjang'; end if;
 if p_employment<>'PNS' and (p_pns_jf_formation='YA' or p_nomenclature_updated='YA')
 then raise exception 'Isian formasi dan penyesuaian PNS tidak konsisten'; end if;
 if p_study_status in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
 and (p_graduation_date is null or p_graduation_date>current_date) then
  raise exception 'Tanggal kelulusan yang sudah terjadi wajib diisi'; end if;
 -- Keep existing independently verified diploma immutable.
 select * into v_existing from public.jf2030_qualification where owner_id=auth.uid() for update;
 if found and v_existing.review_status='TERVERIFIKASI' then
   if v_existing.education_initial is distinct from p_education
      or v_existing.study_status is distinct from p_study_status
      or v_existing.university is distinct from btrim(coalesce(p_university,''))
      or v_existing.study_program is distinct from btrim(coalesce(p_program,''))
      or v_existing.start_year is distinct from p_start_year
      or v_existing.target_graduation is distinct from p_target_graduation
      or v_existing.graduation_date is distinct from p_graduation_date then
     raise exception 'Ijazah terverifikasi berbeda dengan isian baru; minta koreksi melalui Dinas'; end if;
 elsif coalesce(v_profile.nip,'') ~ '^[0-9]{18}$' and (
     v_existing.owner_id is null
     or v_existing.education_initial is distinct from p_education
     or v_existing.study_status is distinct from p_study_status
     or v_existing.university is distinct from btrim(coalesce(p_university,''))
     or v_existing.study_program is distinct from btrim(coalesce(p_program,''))
     or v_existing.start_year is distinct from p_start_year
     or v_existing.target_graduation is distinct from p_target_graduation
     or v_existing.graduation_date is distinct from p_graduation_date
     or v_existing.notes is distinct from coalesce(p_notes,'')
   ) then
   -- Legacy education 2030 RPC requires NIP. Preserve non-ASN education
   -- in SMART-GTK when they have no valid ASN NIP instead of blocking intake.
   perform public.jf2030_save_progress(p_education,p_study_status,
     coalesce(p_university,''),coalesce(p_program,''),p_start_year,
     p_target_graduation,p_graduation_date,coalesce(p_notes,''));
 end if;
 insert into public.smartgtk_intake(
  owner_id,nip,full_name,unit_work,employment,jf_sk,old_position,nomenclature_updated,
  pns_jf_formation,education,study_status,university,study_program,start_year,
  target_graduation,graduation_date,notes
 ) values (
  auth.uid(),coalesce(v_profile.nip,''),coalesce(nullif(btrim(v_profile.full_name),''),'GTK'),
  coalesce(nullif(btrim(v_profile.unit_gtk),''),nullif(btrim(v_profile.unit),''),'Belum diisi'),
  p_employment,p_jf_sk,coalesce(p_old_position,''),p_nomenclature_updated,
  p_pns_jf_formation,p_education,p_study_status,coalesce(p_university,''),
  coalesce(p_program,''),p_start_year,p_target_graduation,p_graduation_date,coalesce(p_notes,'')
 ) on conflict (owner_id) do update set
  nip=excluded.nip,full_name=excluded.full_name,unit_work=excluded.unit_work,
  employment=excluded.employment,jf_sk=excluded.jf_sk,old_position=excluded.old_position,
  nomenclature_updated=excluded.nomenclature_updated,pns_jf_formation=excluded.pns_jf_formation,
  education=excluded.education,study_status=excluded.study_status,university=excluded.university,
  study_program=excluded.study_program,start_year=excluded.start_year,
  target_graduation=excluded.target_graduation,graduation_date=excluded.graduation_date,
  notes=excluded.notes,updated_at=now(),analysis_version=1;
 insert into public.smartgtk_audit(owner_id,actor_id,action) values(auth.uid(),auth.uid(),'INTAKE_SAVED_ANALYZED');
 v_result:=public.smartgtk_classify(p_employment,p_jf_sk,p_nomenclature_updated,p_pns_jf_formation,p_education,p_old_position);
 return v_result;
end;
$$;



notify pgrst, 'reload schema';
