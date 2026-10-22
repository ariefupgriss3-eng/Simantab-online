-- Qualification tracking includes teachers who already hold S-1/D-IV/S-2/S-3.
-- Status SUDAH_MEMENUHI is a SELF DECLARATION until a Dinas officer verifies the diploma.
-- Separate from the legal deadline and appointment eligibility. Additive to existing rows.
-- Required after jf2030_qualification_monitoring; DO NOT run as part of page-load scripts.
alter table public.jf2030_qualification
 drop constraint if exists jf2030_qualification_education_initial_check,
 drop constraint if exists jf2030_qualification_study_status_check,
 drop constraint if exists jf2030_graduation_evidence_check;

alter table public.jf2030_qualification
 add constraint jf2030_qualification_education_initial_check
 check (education_initial in ('SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3')),
 add constraint jf2030_qualification_study_status_check
 check (study_status in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF','SUDAH_MEMENUHI')),
 add constraint jf2030_education_study_coherence_check
 check (
  (education_initial in ('SLTA','SPG','DI','DII','DIII') and study_status in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF'))
  or
  (education_initial in ('S1','DIV','S2','S3') and study_status='SUDAH_MEMENUHI')
 ),
 add constraint jf2030_graduation_evidence_check
 check (review_status <> 'TERVERIFIKASI' or
 (study_status in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI') and graduation_date is not null and evidence_path is not null));

-- Preserve private bucket and max 1.5 MiB; only extend its pre-existing INSERT guard.
drop policy if exists jf2030_proof_upload on storage.objects;
create policy jf2030_proof_upload on storage.objects for insert to authenticated
 with check(bucket_id='simantab-jf-ijazah-2030'
 and split_part(name,'/',1)=auth.uid()::text
 and split_part(name,'/',2) ~ '^IJAZAH-[a-f0-9-]+\.(pdf|jpg|png)$'
 and exists(select 1 from public.jf2030_qualification q
 where q.owner_id=auth.uid() and q.study_status in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
 and q.review_status<>'TERVERIFIKASI'));

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
 if p_education not in ('SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3')
  or p_study_status not in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
  or (p_education in ('S1','DIV','S2','S3') and p_study_status <> 'SUDAH_MEMENUHI')
  or (p_education in ('SLTA','SPG','DI','DII','DIII') and p_study_status = 'SUDAH_MEMENUHI')
 then raise exception 'Jenjang pendidikan atau perkembangan studi tidak sah'; end if;
 if length(coalesce(p_university,''))>200 or length(coalesce(p_program,''))>200
  or length(coalesce(p_notes,''))>2000
 then raise exception 'Teks terlalu panjang'; end if;
 if p_start_year is not null and (p_start_year<1970 or p_start_year>2030)
 then raise exception 'Tahun mulai kuliah tidak sah'; end if;
 if p_study_status='SEDANG_KULIAH'
  and (btrim(coalesce(p_university,''))='' or btrim(coalesce(p_program,''))='')
 then raise exception 'Perguruan tinggi dan program studi wajib diisi'; end if;
 if p_study_status in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
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
    and public.jf2030_qualification.education_initial=excluded.education_initial
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
 if not found or q.study_status not in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI') or q.review_status='TERVERIFIKASI'
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
   (q.study_status not in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI') or q.graduation_date is null
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

comment on constraint jf2030_education_study_coherence_check on public.jf2030_qualification is
 'S1/DIV/S2/S3 is a self-declared qualification until independent diploma verification. Legacy diplomas keep 2030 monitoring status.';

-- PostgREST reload only after successful transaction.
notify pgrst, 'reload schema';
