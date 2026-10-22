-- Only synthetic accounts on an ephemeral CI database, never production.
\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $deny_invalid$
begin
 begin
  perform public.jf2030_save_progress('DI','SUDAH_MEMENUHI','Univ Uji','PGSD',2024,null,'2026-10-01','Invalid combo');
  raise exception 'FAIL: low qualification accepted as already completed';
 exception when others then
  if position('Jenjang pendidikan atau perkembangan studi tidak sah' in sqlerrm)=0 then raise; end if;
 end;
 begin
  perform public.jf2030_save_progress('S1','BELUM_KULIAH','Univ Uji','PGSD',2024,null,'2026-10-01','Invalid combo');
  raise exception 'FAIL: degree-qualified user marked as unqualified';
 exception when others then
  if position('Jenjang pendidikan atau perkembangan studi tidak sah' in sqlerrm)=0 then raise; end if;
 end;
end $deny_invalid$;

-- Prior SPG record is updated, with no deletion of profile or event history.
select public.jf2030_save_progress('S2','SUDAH_MEMENUHI','Universitas Uji','Manajemen Pendidikan',2019,null,'2026-10-01','Ijazah tersedia');
do $degree_record$
begin
 if not exists(select 1 from public.jf2030_qualification q where q.owner_id=auth.uid()
 and q.education_initial='S2' and q.study_status='SUDAH_MEMENUHI'
 and q.review_status='BELUM_DITELAAH' and q.evidence_path is null)
 then raise exception 'FAIL: completed degree declaration not saved securely'; end if;
end $degree_record$;

-- New degree status also supports S1, DIV, S3; all remain unverified without evidence.
select public.jf2030_save_progress('S1','SUDAH_MEMENUHI','Universitas Uji','PGSD',2018,null,'2026-10-01','Ijazah S1');
select public.jf2030_save_progress('DIV','SUDAH_MEMENUHI','Universitas Uji','Pendidikan',2018,null,'2026-10-01','Ijazah DIV');
select public.jf2030_save_progress('S3','SUDAH_MEMENUHI','Universitas Uji','Pendidikan',2018,null,'2026-10-01','Ijazah S3');

-- Last chosen education must control the verification evidence: upload allowed but never auto-verified.
do $proof_required$
begin
 begin
  perform public.jf2030_attach_diploma(auth.uid()::text||'/IJAZAH-00000000-0000-4000-8000-000000000222.pdf');
  raise exception 'FAIL: accepted nonexistent S3 proof';
 exception when others then
  if position('Bukti ijazah tidak ditemukan' in sqlerrm)=0 then raise; end if;
 end;
end $proof_required$;
insert into storage.objects(bucket_id,name)
values('simantab-jf-ijazah-2030','00000000-0000-4000-8000-000000000002/IJAZAH-00000000-0000-4000-8000-000000000222.pdf');
select public.jf2030_attach_diploma('00000000-0000-4000-8000-000000000002/IJAZAH-00000000-0000-4000-8000-000000000222.pdf');
do $after_upload$
begin
 if not exists(select 1 from public.jf2030_qualification where owner_id=auth.uid()
 and review_status='BELUM_DITELAAH' and evidence_path is not null)
 then raise exception 'FAIL: uploaded degree proof incorrectly auto-approved'; end if;
end $after_upload$;

set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.jf2030_review('00000000-0000-4000-8000-000000000002','TERVERIFIKASI','Ijazah S3 sintetis diperiksa dengan benar');
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $locked$
begin
 if not exists(select 1 from public.jf2030_qualification where owner_id=auth.uid()
 and education_initial='S3' and review_status='TERVERIFIKASI')
 then raise exception 'FAIL: qualification check failed'; end if;
 begin
  perform public.jf2030_save_progress('S2','SUDAH_MEMENUHI','Universitas Uji','Program Uji',2017,null,'2026-10-01','Try overwrite');
  raise exception 'FAIL: verified record overwritten';
 exception when others then
  if position('dikunci' in sqlerrm)=0 then raise; end if;
 end;
end $locked$;
select 'JF2030 completed education and evidence checks PASS' as result;