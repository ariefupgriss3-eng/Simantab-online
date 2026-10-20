-- SMART-GTK V1: one factual questionnaire, three INDEPENDENT preliminary screenings.
-- No automated formal JF case submission, officer approval, diploma validation, or SK issuance.
-- Additive; requires existing jf2030_save_progress and private.jf2026_is_officer.
create table if not exists public.smartgtk_intake (
 owner_id uuid primary key references auth.users(id),
 nip text not null check(nip ~ '^[0-9]{18}$'),
 full_name text not null,
 unit_work text not null,
 employment text not null check(employment in ('PNS','PPPK','PPPK_PW','NON_ASN','LAINNYA')),
 jf_sk text not null check(jf_sk in ('YA','TIDAK','BELUM_TAHU')),
 old_position text not null default '' check(length(old_position)<=160),
 nomenclature_updated text not null check(nomenclature_updated in ('YA','TIDAK','BELUM_TAHU','TIDAK_BERLAKU')),
 pns_jf_formation text not null check(pns_jf_formation in ('YA','TIDAK','BELUM_TAHU')),
 education text not null check(education in ('SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3')),
 study_status text not null check(study_status in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF','SUDAH_MEMENUHI')),
 university text not null default '',
 study_program text not null default '',
 start_year integer,
 target_graduation date,
 graduation_date date,
 notes text not null default '',
 analysis_version integer not null default 1,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 constraint smartgtk_education_study_coherent check(
  (education in ('S1','DIV','S2','S3') and study_status='SUDAH_MEMENUHI') or
  (education in ('SLTA','SPG','DI','DII','DIII') and study_status<>'SUDAH_MEMENUHI')
 )
);
create index if not exists smartgtk_intake_updated_idx on public.smartgtk_intake(updated_at desc);
create table if not exists public.smartgtk_audit (
 id bigint generated always as identity primary key,
 owner_id uuid not null references auth.users(id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 created_at timestamptz not null default now()
);
alter table public.smartgtk_intake enable row level security;
alter table public.smartgtk_audit enable row level security;
revoke all on public.smartgtk_intake,public.smartgtk_audit from public,anon,authenticated;
grant select on public.smartgtk_intake,public.smartgtk_audit to authenticated;
create policy smartgtk_read on public.smartgtk_intake for select to authenticated
 using(owner_id=auth.uid() or (select private.jf2026_is_officer()));
create policy smartgtk_audit_read on public.smartgtk_audit for select to authenticated
 using(owner_id=auth.uid() or (select private.jf2026_is_officer()));

-- Output is PRELIMINARY routing, never legal approval.
create or replace function public.smartgtk_classify(
 e text, sk text, nomen text, formasi text, edu text, old_jf text
) returns jsonb language plpgsql immutable set search_path=''
as $$
declare n text:='TIDAK_TERINDIKASI'; a text:='TIDAK_TERINDIKASI'; q text:='TIDAK_TERINDIKASI';
begin
 if e='PNS' then
   if sk='YA' then
     if btrim(coalesce(old_jf,''))='' or nomen='BELUM_TAHU' then n:='PERLU_DATA';
     elsif nomen='TIDAK' then n:='POTENSI_USUL';
     else n:='TIDAK_TERINDIKASI'; end if;
   elsif sk='BELUM_TAHU' then n:='PERLU_DATA'; end if;
   if sk='TIDAK' then
     if formasi='YA' then
       if edu in ('S1','DIV','S2','S3') then a:='POTENSI_USUL';
       else a:='TERTAHAN_KUALIFIKASI'; end if;
     elsif formasi='BELUM_TAHU' then a:='PERLU_DATA'; end if;
   elsif sk='BELUM_TAHU' then a:='PERLU_DATA'; end if;
 end if;
 if edu in ('DI','DII','DIII') then q:='PERLU_PEMENUHAN_2030';
 elsif edu in ('SLTA','SPG') then q:='TELAAH_KHUSUS';
 elsif edu in ('S1','DIV','S2','S3') then q:='DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI';
 else q:='PERLU_DATA'; end if;
 return jsonb_build_object(
   'nomenklatur',n,'pengangkatan',a,'kualifikasi',q,
   'hasil','SKRINING_AWAL_BUKAN_KEPUTUSAN',
   'versi',1,
   'catatan','Kelayakan final mengikuti surat dan peraturan yang berlaku serta pemeriksaan dokumen petugas.'
 );
end;
$$;

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
 and account_channel='GTK' and approval_status='APPROVED' and is_active=true
 and nip ~ '^[0-9]{18}$';
 if not found then raise exception 'Hanya GTK aktif/disetujui dengan NIP 18 digit'; end if;
 if (select count(*) from public.profiles
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
   if v_existing.education_initial<>p_education or v_existing.study_status<>p_study_status
      or v_existing.graduation_date is distinct from p_graduation_date then
     raise exception 'Ijazah terverifikasi berbeda dengan isian baru; minta koreksi melalui Dinas'; end if;
 else
   perform public.jf2030_save_progress(p_education,p_study_status,
     coalesce(p_university,''),coalesce(p_program,''),p_start_year,
     p_target_graduation,p_graduation_date,coalesce(p_notes,''));
 end if;
 insert into public.smartgtk_intake(
  owner_id,nip,full_name,unit_work,employment,jf_sk,old_position,nomenclature_updated,
  pns_jf_formation,education,study_status,university,study_program,start_year,
  target_graduation,graduation_date,notes
 ) values (
  auth.uid(),v_profile.nip,coalesce(nullif(btrim(v_profile.full_name),''),'GTK'),
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

-- Read-only officer roster, max 50 per page; no full-profile dumps.
create or replace function public.smartgtk_officer_list(p_page integer default 0)
returns table(owner_id uuid,full_name text,nip text,unit_work text,
 employment text,education text,screening jsonb,updated_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas'; end if;
 if p_page is null or p_page<0 or p_page>10000 then raise exception 'Halaman tidak valid'; end if;
 return query
 select s.owner_id,s.full_name,s.nip,s.unit_work,s.employment,s.education,
 public.smartgtk_classify(s.employment,s.jf_sk,s.nomenclature_updated,
 s.pns_jf_formation,s.education,s.old_position),s.updated_at
 from public.smartgtk_intake s order by s.updated_at desc,s.owner_id
 limit 50 offset (p_page::bigint*50);
end;
$$;

revoke all on function public.smartgtk_classify(text,text,text,text,text,text) from public,anon;
revoke all on function public.smartgtk_save(text,text,text,text,text,text,text,text,text,integer,date,date,text) from public,anon;
revoke all on function public.smartgtk_officer_list(integer) from public,anon;
grant execute on function public.smartgtk_classify(text,text,text,text,text,text) to authenticated;
grant execute on function public.smartgtk_save(text,text,text,text,text,text,text,text,text,integer,date,date,text) to authenticated;
grant execute on function public.smartgtk_officer_list(integer) to authenticated;
comment on table public.smartgtk_intake is
 'Factual self-report shared intake for preliminary screening ONLY; not JF proposal approval or administrative appointment.';
notify pgrst, 'reload schema';
