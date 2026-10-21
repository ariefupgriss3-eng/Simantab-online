-- Scalable rollout. Default PILOT so NO mass activation occurs with migration.
-- A Dinas officer must explicitly switch to OPEN after approval and production QA.
create table if not exists public.smartgtk_rollout_settings(
 id boolean primary key default true check(id=true),
 mode text not null default 'PILOT' check(mode in ('OFF','PILOT','OPEN')),
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.smartgtk_rollout_settings enable row level security;
revoke all on public.smartgtk_rollout_settings from public,anon,authenticated;
insert into public.smartgtk_rollout_settings(id,mode) values(true,'PILOT')
on conflict(id) do nothing;

create table if not exists public.smartgtk_rollout_history(
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 old_mode text not null,new_mode text not null,
 created_at timestamptz not null default now()
);
alter table public.smartgtk_rollout_history enable row level security;
revoke all on public.smartgtk_rollout_history from public,anon,authenticated;
grant select on public.smartgtk_rollout_history to authenticated;
create policy smartgtk_rollout_history_officers on public.smartgtk_rollout_history for select to authenticated
 using((select private.jf2026_is_officer()));

create or replace function private.smartgtk_current_user_can_participate()
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and exists(
  select 1 from public.profiles p
  join public.smartgtk_rollout_settings config on config.id=true
  where p.id=auth.uid() and p.is_active=true and p.approval_status='APPROVED'
    and ((p.account_channel='GTK' and p.role in ('GTK','KEPALA_SEKOLAH')) or p.role='PENGAWAS')
    and (config.mode='OPEN' or (config.mode='PILOT' and exists(
      select 1 from public.smartgtk_pilot_users x where x.owner_id=p.id and x.enabled=true)))
 );
$$;
revoke all on function private.smartgtk_current_user_can_participate() from public,anon,authenticated;
-- Restrictive insert guard for this private bucket only; unrelated SIMANTAB buckets unaffected.
create policy smartgtk_upload_rollout_guard on storage.objects
 as restrictive for insert to authenticated
 with check(bucket_id<>'simantab-smartgtk-private'
  or (select public.smartgtk_pilot_status()));


create or replace function public.smartgtk_pilot_status()
returns boolean language sql stable security definer set search_path=''
as $$
 select private.smartgtk_current_user_can_participate();
$$;

create or replace function public.smartgtk_mass_rollout_mode()
returns text language plpgsql stable security definer set search_path=''
as $$
declare state text;
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas';end if;
 select mode into state from public.smartgtk_rollout_settings where id=true;
 return state;
end;
$$;

create or replace function public.smartgtk_mass_set_rollout(p_mode text)
returns void language plpgsql security definer set search_path=''
as $$
declare previous_mode text;
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas';end if;
 if p_mode is null or p_mode not in ('OFF','PILOT','OPEN') then
  raise exception 'Mode aktivasi tidak dikenal';end if;
 select mode into previous_mode from public.smartgtk_rollout_settings where id=true for update;
 if previous_mode is null then raise exception 'Konfigurasi SMART-GTK belum tersedia';end if;
 if previous_mode is not distinct from p_mode then return;end if;
 update public.smartgtk_rollout_settings set mode=p_mode,updated_by=auth.uid(),updated_at=now()
 where id=true;
 insert into public.smartgtk_rollout_history(actor_id,old_mode,new_mode)
 values(auth.uid(),previous_mode,p_mode);
end;
$$;

revoke all on function public.smartgtk_mass_rollout_mode() from public,anon;
revoke all on function public.smartgtk_mass_set_rollout(text) from public,anon;
grant execute on function public.smartgtk_mass_rollout_mode() to authenticated;
grant execute on function public.smartgtk_mass_set_rollout(text) to authenticated;

create or replace function public.smartgtk_mass_save(
 p_profession text,
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
 and ((account_channel='GTK' and role in ('GTK','KEPALA_SEKOLAH'))
   or (role='PENGAWAS'))
 and approval_status='APPROVED' and is_active=true;
 if not found then raise exception 'Akun GTK/pengawas harus aktif dan disetujui'; end if;
 if p_profession is null or p_profession not in ('GURU','KEPALA_SEKOLAH','PENGAWAS','TENDIK') then
  raise exception 'Jenis tugas GTK wajib dipilih'; end if;
 if v_profile.role='KEPALA_SEKOLAH' and p_profession<>'KEPALA_SEKOLAH' then
  raise exception 'Akun Kepala Sekolah wajib memilih jenis tugas Kepala Sekolah'; end if;
 if v_profile.role='PENGAWAS' and p_profession<>'PENGAWAS' then
  raise exception 'Akun Pengawas wajib memilih jenis tugas Pengawas'; end if;
 if v_profile.role='GTK' and p_profession not in ('GURU','TENDIK') then
  raise exception 'Akun GTK dapat memilih Guru atau Tenaga Kependidikan'; end if;
 -- Pilot restriction is checked SERVER-SIDE, not inferred from frontend visibility.
 if not private.smartgtk_current_user_can_participate() then
  raise exception 'Akses SMART-GTK belum diaktifkan untuk akun ini'; end if;
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
 elsif v_profile.account_channel='GTK' and coalesce(v_profile.nip,'') ~ '^[0-9]{18}$' and (
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
  owner_id,nip,full_name,unit_work,employment,jf_sk,old_position,nomenclature_updated,profession,
  pns_jf_formation,education,study_status,university,study_program,start_year,
  target_graduation,graduation_date,notes
 ) values (
  auth.uid(),coalesce(v_profile.nip,''),coalesce(nullif(btrim(v_profile.full_name),''),'GTK'),
  coalesce(nullif(btrim(v_profile.unit_gtk),''),nullif(btrim(v_profile.unit),''),'Belum diisi'),
  p_employment,p_jf_sk,coalesce(p_old_position,''),p_nomenclature_updated,p_profession,
  p_pns_jf_formation,p_education,p_study_status,coalesce(p_university,''),
  coalesce(p_program,''),p_start_year,p_target_graduation,p_graduation_date,coalesce(p_notes,'')
 ) on conflict (owner_id) do update set
  nip=excluded.nip,full_name=excluded.full_name,unit_work=excluded.unit_work,
  employment=excluded.employment,jf_sk=excluded.jf_sk,old_position=excluded.old_position,profession=excluded.profession,
  nomenclature_updated=excluded.nomenclature_updated,pns_jf_formation=excluded.pns_jf_formation,
  education=excluded.education,study_status=excluded.study_status,university=excluded.university,
  study_program=excluded.study_program,start_year=excluded.start_year,
  target_graduation=excluded.target_graduation,graduation_date=excluded.graduation_date,
  notes=excluded.notes,updated_at=now(),analysis_version=2,data_stage='DRAFT';
 insert into public.smartgtk_audit(owner_id,actor_id,action) values(auth.uid(),auth.uid(),'INTAKE_SAVED_ANALYZED');
 v_result:=public.smartgtk_mass_classify(p_profession,p_employment,p_jf_sk,p_nomenclature_updated,p_pns_jf_formation,p_education,p_old_position);
 return v_result;
end;
$$;

create or replace function public.smartgtk_mass_register_file(p_type text,p_path text)
returns void language plpgsql security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype; valid_types text[];
begin
 select * into v from public.smartgtk_intake where owner_id=auth.uid() for update;
 if not found then raise exception 'Isi SMART-GTK dahulu sebelum unggah dokumen'; end if;
 if not private.smartgtk_current_user_can_participate() then
 raise exception 'Akses SMART-GTK belum diaktifkan untuk akun ini';end if;
 if v.employment='PNS' then
  valid_types:=array['SK_KP','IJAZAH_TERAKHIR','SK_JF','SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2'];
 elsif v.employment='PPPK' then
  valid_types:=array['SK_PPPK','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS'];
 elsif v.employment='PPPK_PW' then
  valid_types:=array['SK_PPPK_PW','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS'];
 else raise exception 'Kelompok ini tidak mengunggah dokumen SMART-GTK';end if;
 if p_type is null or p_type <> all(valid_types) then raise exception 'Jenis dokumen tidak sesuai status kerja'; end if;
 if p_path is null or p_path not like auth.uid()::text||'/'||p_type||'/%'
 or split_part(p_path,'/',3) !~ '^[a-f0-9-]{36}\.(pdf|jpg|png)$'
 or array_length(string_to_array(p_path,'/'),1)<>3 then
  raise exception 'Lokasi dokumen tidak sesuai pemilik dan jenis berkas';end if;
 if not exists(select 1 from storage.objects
   where bucket_id='simantab-smartgtk-private' and name=p_path) then
   raise exception 'Berkas tidak ditemukan di penyimpanan privat';end if;
 insert into public.smartgtk_documents(owner_id,doc_type,storage_path)
 values(auth.uid(),p_type,p_path)
 on conflict(owner_id,doc_type) do update set storage_path=excluded.storage_path,uploaded_at=now();
 update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'EVIDENCE_REGISTERED_'||p_type);
end;
$$;

create or replace function public.smartgtk_mass_complete()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare s jsonb;
begin
 if not private.smartgtk_current_user_can_participate() then
 raise exception 'Akses SMART-GTK belum diaktifkan untuk akun ini';end if;
 s:=public.smartgtk_mass_status();
 if s->>'state'='BELUM_MENGISI' then raise exception 'Isi data SMART-GTK lebih dahulu'; end if;
 if s->>'employment'='PNS' and jsonb_array_length(s->'missing')>0 then
  raise exception 'Berkas PNS belum lengkap. Periksa daftar dokumen wajib';end if;
 update public.smartgtk_intake set data_stage=
  case when s->>'employment'='PNS' then 'BERKAS_LENGKAP' else 'DATA_TERCATAT' end,
  updated_at=now() where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'DATA_COMPLETENESS_CONFIRMED');
 return public.smartgtk_mass_status();
end;
$$;
notify pgrst, 'reload schema';
