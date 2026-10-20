-- Pemenuhan kualifikasi akademik S-1/D-IV hingga 11 Mei 2030.
-- Pelacakan terpisah dari usul JF Guru 2026; tidak menetapkan kelayakan hukum secara otomatis.
-- Tenggat 2030 mengikuti ketentuan D-I/D-II/D-III; SLTA/SPG memerlukan telaah khusus.
-- Migration for staging/QA. Production was separately authorized and applied on 2026-10-20 through the Supabase migration API; policy guards support future migration replay without duplicate-policy errors.
create table if not exists public.jf2030_qualification (
 owner_id uuid primary key references auth.users(id),
 nip text not null unique check(nip ~ '^[0-9]{18}$'),
 full_name text not null check(length(btrim(full_name)) between 3 and 160),
 unit_work text not null,
 education_initial text not null check(education_initial in ('SLTA','SPG','DI','DII','DIII')),
 study_status text not null check(study_status in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF')),
 university text not null default '' check(length(university)<=200),
 study_program text not null default '' check(length(study_program)<=200),
 start_year integer check(start_year between 1970 and 2030),
 target_graduation date,
 graduation_date date,
 notes text not null default '' check(length(notes)<=2000),
 evidence_path text,
 review_status text not null default 'BELUM_DITELAAH'
  check(review_status in ('BELUM_DITELAAH','PERLU_PERBAIKAN','TERVERIFIKASI')),
 review_note text not null default '',
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 constraint jf2030_graduation_evidence_check
  check(review_status<>'TERVERIFIKASI' or
    (study_status='LULUS_BELUM_VERIF' and graduation_date is not null and evidence_path is not null))
);
create index if not exists jf2030_qualification_status_idx
 on public.jf2030_qualification(education_initial,study_status,review_status,updated_at desc);

create table if not exists public.jf2030_events (
 id bigint generated always as identity primary key,
 owner_id uuid not null references public.jf2030_qualification(owner_id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists jf2030_events_owner_idx on public.jf2030_events(owner_id,created_at desc);

alter table public.jf2030_qualification enable row level security;
alter table public.jf2030_events enable row level security;
revoke all on public.jf2030_qualification,public.jf2030_events from public,anon,authenticated;
grant select on public.jf2030_qualification,public.jf2030_events to authenticated;
do $create_jf2030_read$
begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='jf2030_qualification' and policyname='jf2030_read') then
  create policy jf2030_read on public.jf2030_qualification for select to authenticated
   using(owner_id=auth.uid() or (select private.jf2026_is_officer()));
 end if;
end $create_jf2030_read$;
do $create_jf2030_event_read$
begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='jf2030_events' and policyname='jf2030_event_read') then
  create policy jf2030_event_read on public.jf2030_events for select to authenticated
   using(owner_id=auth.uid() or (select private.jf2026_is_officer()));
 end if;
end $create_jf2030_event_read$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('simantab-jf-ijazah-2030','simantab-jf-ijazah-2030',false,1572864,
 array['application/pdf','image/jpeg','image/png'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;
do $create_jf2030_proof_read$
begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='jf2030_proof_read') then
  create policy jf2030_proof_read on storage.objects for select to authenticated
   using(bucket_id='simantab-jf-ijazah-2030'
   and exists(select 1 from public.jf2030_qualification q
   where q.owner_id::text=split_part(name,'/',1)
     and (q.owner_id=auth.uid() or (select private.jf2026_is_officer()))));
 end if;
end $create_jf2030_proof_read$;
do $create_jf2030_proof_upload$
begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='jf2030_proof_upload') then
  create policy jf2030_proof_upload on storage.objects for insert to authenticated
   with check(bucket_id='simantab-jf-ijazah-2030'
   and split_part(name,'/',1)=auth.uid()::text
   and split_part(name,'/',2) ~ '^IJAZAH-[a-f0-9-]+\.(pdf|jpg|png)
-- No overwrite or delete permission on evidence objects.

create or replace function public.jf2030_save_progress(
 p_education text, p_study_status text, p_university text,
 p_program text, p_start_year integer, p_target_graduation date,
 p_graduation_date date, p_notes text
) returns void language plpgsql security definer set search_path=''
as $$
declare v_profile public.profiles%rowtype; v_old public.jf2030_qualification%rowtype;
begin
 select * into v_profile from public.profiles where id=auth.uid()
 and account_channel='GTK' and is_active=true and approval_status='APPROVED'
 and nip ~ '^[0-9]{18}$';
 if not found then raise exception 'Hanya akun GTK aktif dengan NIP valid'; end if;
 if p_education not in ('SLTA','SPG','DI','DII','DIII')
  or p_study_status not in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF')
 then raise exception 'Jenjang pendidikan atau perkembangan studi tidak sah'; end if;
 if length(coalesce(p_university,''))>200 or length(coalesce(p_program,''))>200
  or length(coalesce(p_notes,''))>2000
 then raise exception 'Teks terlalu panjang'; end if;
 if p_start_year is not null and (p_start_year<1970 or p_start_year>2030)
 then raise exception 'Tahun mulai kuliah tidak sah'; end if;
 if p_study_status='SEDANG_KULIAH'
  and (btrim(coalesce(p_university,''))='' or btrim(coalesce(p_program,''))='')
 then raise exception 'Perguruan tinggi dan program studi wajib diisi'; end if;
 if p_study_status='LULUS_BELUM_VERIF'
  and (p_graduation_date is null or p_graduation_date>current_date)
 then raise exception 'Tanggal kelulusan yang telah terjadi wajib diisi'; end if;
 select * into v_old from public.jf2030_qualification where owner_id=auth.uid() for update;
 if found and v_old.review_status='TERVERIFIKASI'
 then raise exception 'Data ijazah yang telah diverifikasi dikunci; hubungi Dinas'; end if;
 insert into public.jf2030_qualification(
  owner_id,nip,full_name,unit_work,education_initial,study_status,university,
  study_program,start_year,target_graduation,graduation_date,notes)
 values(
  auth.uid(),v_profile.nip,coalesce(nullif(btrim(v_profile.full_name),''),'GTK'),
  coalesce(v_profile.unit,''),p_education,p_study_status,btrim(coalesce(p_university,'')),
  btrim(coalesce(p_program,'')),p_start_year,p_target_graduation,p_graduation_date,
  coalesce(p_notes,''))
 on conflict(owner_id) do update set
  nip=excluded.nip,full_name=excluded.full_name,unit_work=excluded.unit_work,
  education_initial=excluded.education_initial,study_status=excluded.study_status,
  university=excluded.university,study_program=excluded.study_program,
  start_year=excluded.start_year,target_graduation=excluded.target_graduation,
  graduation_date=excluded.graduation_date,notes=excluded.notes,
  evidence_path=case when public.jf2030_qualification.study_status=excluded.study_status
    and public.jf2030_qualification.graduation_date is not distinct from excluded.graduation_date
    then public.jf2030_qualification.evidence_path else null end,
  review_status='BELUM_DITELAAH',review_note='',reviewed_at=null,reviewed_by=null,
  updated_at=now();
 insert into public.jf2030_events(owner_id,actor_id,action,note)
 values(auth.uid(),auth.uid(),'PROGRESS_SAVED','Data perkembangan studi diperbarui');
end;
$$;

create or replace function public.jf2030_attach_diploma(p_path text)
returns void language plpgsql security definer set search_path=''
as $$
declare q public.jf2030_qualification%rowtype;
begin
 select * into q from public.jf2030_qualification where owner_id=auth.uid() for update;
 if not found or q.study_status<>'LULUS_BELUM_VERIF' or q.review_status='TERVERIFIKASI'
 then raise exception 'Catat kelulusan lebih dahulu atau hubungi Dinas'; end if;
 if split_part(p_path,'/',1)<>auth.uid()::text
 or split_part(p_path,'/',2) !~ '^IJAZAH-[a-f0-9-]+\.(pdf|jpg|png)$'
 or length(p_path)>220
 then raise exception 'Lokasi bukti ijazah tidak sah'; end if;
 if not exists(select 1 from storage.objects where bucket_id='simantab-jf-ijazah-2030' and name=p_path)
 then raise exception 'Bukti ijazah tidak ditemukan'; end if;
 update public.jf2030_qualification set evidence_path=p_path,review_status='BELUM_DITELAAH',
 review_note='',reviewed_at=null,reviewed_by=null,updated_at=now() where owner_id=auth.uid();
 insert into public.jf2030_events(owner_id,actor_id,action,note)
 values(auth.uid(),auth.uid(),'EVIDENCE_UPLOADED','Bukti ijazah menunggu verifikasi Dinas');
end;
$$;

create or replace function public.jf2030_review(
 p_owner_id uuid, p_next_status text, p_note text
) returns void language plpgsql security definer set search_path=''
as $$
declare q public.jf2030_qualification%rowtype;
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas berwenang'; end if;
 if p_next_status not in ('TERVERIFIKASI','PERLU_PERBAIKAN')
 then raise exception 'Status verifikasi tidak sah'; end if;
 if length(btrim(coalesce(p_note,'')))<5
 then raise exception 'Catatan verifikasi harus menjelaskan keputusan'; end if;
 select * into q from public.jf2030_qualification where owner_id=p_owner_id for update;
 if not found then raise exception 'Data pendidikan tidak ditemukan'; end if;
 if p_next_status='TERVERIFIKASI' and
   (q.study_status<>'LULUS_BELUM_VERIF' or q.graduation_date is null
    or q.evidence_path is null or not exists(
      select 1 from storage.objects where bucket_id='simantab-jf-ijazah-2030'
        and name=q.evidence_path))
 then raise exception 'Verifikasi memerlukan kelulusan dan bukti ijazah'; end if;
 update public.jf2030_qualification set review_status=p_next_status,review_note=btrim(p_note),
 reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where owner_id=p_owner_id;
 insert into public.jf2030_events(owner_id,actor_id,action,note)
 values(p_owner_id,auth.uid(),p_next_status,left(btrim(p_note),2000));
end;
$$;

revoke all on function public.jf2030_save_progress(text,text,text,text,integer,date,date,text) from public,anon;
revoke all on function public.jf2030_attach_diploma(text) from public,anon;
revoke all on function public.jf2030_review(uuid,text,text) from public,anon;
grant execute on function public.jf2030_save_progress(text,text,text,text,integer,date,date,text) to authenticated;
grant execute on function public.jf2030_attach_diploma(text) to authenticated;
grant execute on function public.jf2030_review(uuid,text,text) to authenticated;

comment on table public.jf2030_qualification is
 'Monitoring pemenuhan pendidikan guru; tenggat 11 Mei 2030 hanya untuk kategori yang relevan menurut dasar hukum. Verifikasi ijazah bukan keputusan pengangkatan JF.';

   and exists(select 1 from public.jf2030_qualification q
   where q.owner_id=auth.uid() and q.study_status='LULUS_BELUM_VERIF'
   and q.review_status<>'TERVERIFIKASI'));
 end if;
end $create_jf2030_proof_upload$;
-- No overwrite or delete permission on evidence objects.

create or replace function public.jf2030_save_progress(
 p_education text, p_study_status text, p_university text,
 p_program text, p_start_year integer, p_target_graduation date,
 p_graduation_date date, p_notes text
) returns void language plpgsql security definer set search_path=''
as $$
declare v_profile public.profiles%rowtype; v_old public.jf2030_qualification%rowtype;
begin
 select * into v_profile from public.profiles where id=auth.uid()
 and account_channel='GTK' and is_active=true and approval_status='APPROVED'
 and nip ~ '^[0-9]{18}$';
 if not found then raise exception 'Hanya akun GTK aktif dengan NIP valid'; end if;
 if p_education not in ('SLTA','SPG','DI','DII','DIII')
  or p_study_status not in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF')
 then raise exception 'Jenjang pendidikan atau perkembangan studi tidak sah'; end if;
 if length(coalesce(p_university,''))>200 or length(coalesce(p_program,''))>200
  or length(coalesce(p_notes,''))>2000
 then raise exception 'Teks terlalu panjang'; end if;
 if p_start_year is not null and (p_start_year<1970 or p_start_year>2030)
 then raise exception 'Tahun mulai kuliah tidak sah'; end if;
 if p_study_status='SEDANG_KULIAH'
  and (btrim(coalesce(p_university,''))='' or btrim(coalesce(p_program,''))='')
 then raise exception 'Perguruan tinggi dan program studi wajib diisi'; end if;
 if p_study_status='LULUS_BELUM_VERIF'
  and (p_graduation_date is null or p_graduation_date>current_date)
 then raise exception 'Tanggal kelulusan yang telah terjadi wajib diisi'; end if;
 select * into v_old from public.jf2030_qualification where owner_id=auth.uid() for update;
 if found and v_old.review_status='TERVERIFIKASI'
 then raise exception 'Data ijazah yang telah diverifikasi dikunci; hubungi Dinas'; end if;
 insert into public.jf2030_qualification(
  owner_id,nip,full_name,unit_work,education_initial,study_status,university,
  study_program,start_year,target_graduation,graduation_date,notes)
 values(
  auth.uid(),v_profile.nip,coalesce(nullif(btrim(v_profile.full_name),''),'GTK'),
  coalesce(v_profile.unit,''),p_education,p_study_status,btrim(coalesce(p_university,'')),
  btrim(coalesce(p_program,'')),p_start_year,p_target_graduation,p_graduation_date,
  coalesce(p_notes,''))
 on conflict(owner_id) do update set
  nip=excluded.nip,full_name=excluded.full_name,unit_work=excluded.unit_work,
  education_initial=excluded.education_initial,study_status=excluded.study_status,
  university=excluded.university,study_program=excluded.study_program,
  start_year=excluded.start_year,target_graduation=excluded.target_graduation,
  graduation_date=excluded.graduation_date,notes=excluded.notes,
  evidence_path=case when public.jf2030_qualification.study_status=excluded.study_status
    and public.jf2030_qualification.graduation_date is not distinct from excluded.graduation_date
    then public.jf2030_qualification.evidence_path else null end,
  review_status='BELUM_DITELAAH',review_note='',reviewed_at=null,reviewed_by=null,
  updated_at=now();
 insert into public.jf2030_events(owner_id,actor_id,action,note)
 values(auth.uid(),auth.uid(),'PROGRESS_SAVED','Data perkembangan studi diperbarui');
end;
$$;

create or replace function public.jf2030_attach_diploma(p_path text)
returns void language plpgsql security definer set search_path=''
as $$
declare q public.jf2030_qualification%rowtype;
begin
 select * into q from public.jf2030_qualification where owner_id=auth.uid() for update;
 if not found or q.study_status<>'LULUS_BELUM_VERIF' or q.review_status='TERVERIFIKASI'
 then raise exception 'Catat kelulusan lebih dahulu atau hubungi Dinas'; end if;
 if split_part(p_path,'/',1)<>auth.uid()::text
 or split_part(p_path,'/',2) !~ '^IJAZAH-[a-f0-9-]+\.(pdf|jpg|png)$'
 or length(p_path)>220
 then raise exception 'Lokasi bukti ijazah tidak sah'; end if;
 if not exists(select 1 from storage.objects where bucket_id='simantab-jf-ijazah-2030' and name=p_path)
 then raise exception 'Bukti ijazah tidak ditemukan'; end if;
 update public.jf2030_qualification set evidence_path=p_path,review_status='BELUM_DITELAAH',
 review_note='',reviewed_at=null,reviewed_by=null,updated_at=now() where owner_id=auth.uid();
 insert into public.jf2030_events(owner_id,actor_id,action,note)
 values(auth.uid(),auth.uid(),'EVIDENCE_UPLOADED','Bukti ijazah menunggu verifikasi Dinas');
end;
$$;

create or replace function public.jf2030_review(
 p_owner_id uuid, p_next_status text, p_note text
) returns void language plpgsql security definer set search_path=''
as $$
declare q public.jf2030_qualification%rowtype;
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas berwenang'; end if;
 if p_next_status not in ('TERVERIFIKASI','PERLU_PERBAIKAN')
 then raise exception 'Status verifikasi tidak sah'; end if;
 if length(btrim(coalesce(p_note,'')))<5
 then raise exception 'Catatan verifikasi harus menjelaskan keputusan'; end if;
 select * into q from public.jf2030_qualification where owner_id=p_owner_id for update;
 if not found then raise exception 'Data pendidikan tidak ditemukan'; end if;
 if p_next_status='TERVERIFIKASI' and
   (q.study_status<>'LULUS_BELUM_VERIF' or q.graduation_date is null
    or q.evidence_path is null or not exists(
      select 1 from storage.objects where bucket_id='simantab-jf-ijazah-2030'
        and name=q.evidence_path))
 then raise exception 'Verifikasi memerlukan kelulusan dan bukti ijazah'; end if;
 update public.jf2030_qualification set review_status=p_next_status,review_note=btrim(p_note),
 reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where owner_id=p_owner_id;
 insert into public.jf2030_events(owner_id,actor_id,action,note)
 values(p_owner_id,auth.uid(),p_next_status,left(btrim(p_note),2000));
end;
$$;

revoke all on function public.jf2030_save_progress(text,text,text,text,integer,date,date,text) from public,anon;
revoke all on function public.jf2030_attach_diploma(text) from public,anon;
revoke all on function public.jf2030_review(uuid,text,text) from public,anon;
grant execute on function public.jf2030_save_progress(text,text,text,text,integer,date,date,text) to authenticated;
grant execute on function public.jf2030_attach_diploma(text) to authenticated;
grant execute on function public.jf2030_review(uuid,text,text) to authenticated;

comment on table public.jf2030_qualification is
 'Monitoring pemenuhan pendidikan guru; tenggat 11 Mei 2030 hanya untuk kategori yang relevan menurut dasar hukum. Verifikasi ijazah bukan keputusan pengangkatan JF.';
