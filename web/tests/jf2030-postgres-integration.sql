-- All data and users are synthetic: run ONLY on ephemeral CI PostgreSQL.
\set ON_ERROR_STOP on
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
set role authenticated;
select public.jf2030_save_progress('DI','SEDANG_KULIAH','Universitas Uji','PGSD',2025,'2030-04-15',null,'Semester awal');
do $test_progress$
begin
 if not exists(select 1 from public.jf2030_qualification where education_initial='DI'
 and study_status='SEDANG_KULIAH' and owner_id=auth.uid()) then
 raise exception 'FAIL: diploma tracking not persisted'; end if;
end $test_progress$;
-- Another GTK cannot see the first teacher.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $test_isolation$
begin
 if exists(select 1 from public.jf2030_qualification where nip='198001012006042001')
 then raise exception 'FAIL: leaked another GTK education information'; end if;
end $test_isolation$;
-- SPG is recorded for individual review and has no automatic diploma deadline entitlement.
select public.jf2030_save_progress('SPG','BELUM_KULIAH','','',null,null,null,'Perlu penelaahan kasus historis');
do $test_spg$
begin
 if not exists(select 1 from public.jf2030_qualification where owner_id=auth.uid()
 and education_initial='SPG' and review_status='BELUM_DITELAAH')
 then raise exception 'FAIL: SPG tracking not accepted'; end if;
end $test_spg$;
-- Dinas cannot impersonate a GTK applicant.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $test_officer$
begin
 begin
  perform public.jf2030_save_progress('DI','BELUM_KULIAH','','',null,null,null,'');
  raise exception 'FAIL: Dinas created a teacher record';
 exception when others then
  if position('Hanya akun GTK' in sqlerrm)=0 then raise; end if;
 end;
 begin
  perform public.jf2030_review('00000000-0000-4000-8000-000000000001','TERVERIFIKASI','Belum ada ijazah');
  raise exception 'FAIL: allowed verification without evidence';
 exception when others then
  if position('Verifikasi memerlukan' in sqlerrm)=0 then raise; end if;
 end;
end $test_officer$;
-- GTK enters graduation after studies; evidence must exist in private storage.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.jf2030_save_progress('DI','LULUS_BELUM_VERIF','Universitas Uji','PGSD',2025,'2030-04-15','2026-10-01','Lulus; menunggu pemeriksaan.');
do $test_file$
begin
 begin
  perform public.jf2030_attach_diploma(auth.uid()::text||'/IJAZAH-00000000-0000-4000-8000-000000000111.pdf');
  raise exception 'FAIL: metadata without storage object was accepted';
 exception when others then
  if position('Bukti ijazah tidak ditemukan' in sqlerrm)=0 then raise; end if;
 end;
end $test_file$;
insert into storage.objects(bucket_id,name)
values('simantab-jf-ijazah-2030','00000000-0000-4000-8000-000000000001/IJAZAH-00000000-0000-4000-8000-000000000111.pdf');
select public.jf2030_attach_diploma('00000000-0000-4000-8000-000000000001/IJAZAH-00000000-0000-4000-8000-000000000111.pdf');
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.jf2030_review('00000000-0000-4000-8000-000000000001','TERVERIFIKASI','Ijazah diperiksa dan sesuai berkas uji');
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $test_lock$
begin
 if not exists(select 1 from public.jf2030_qualification where owner_id=auth.uid()
 and review_status='TERVERIFIKASI' and evidence_path is not null)
 then raise exception 'FAIL: evidence not verified'; end if;
 begin
  perform public.jf2030_save_progress('DI','BELUM_KULIAH','','',null,null,null,'Trying to overwrite verified proof');
  raise exception 'FAIL: user updated a verified record';
 exception when others then
  if position('dikunci' in sqlerrm)=0 then raise; end if;
 end;
end $test_lock$;
select 'JF2030 synthetic PostgreSQL security integration passed' as result;