\set ON_ERROR_STOP on
-- Compatibility case: source code SK_JABATAN_SEBELUMNYA but actual archive name SK JABFUNG TERAKHIR.
reset role;
insert into storage.objects(bucket_id,name) values
 ('simantab-documents','00000000-0000-4000-8000-000000000005/example/legacy-jabfung-final.pdf'),
 ('simantab-documents','00000000-0000-4000-8000-000000000005/example/unrelated-jabatan.pdf');
insert into public.submission_files(id,user_id,storage_path,file_name,file_size,mime_type,requirement_code) values
 ('00000000-0000-4000-8000-000000000080','00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000005/example/legacy-jabfung-final.pdf',
  '94_SK JABFUNG TERAKHIR_CONTOH.pdf',281492,'application/pdf','SK_JABATAN_SEBELUMNYA'),
 ('00000000-0000-4000-8000-000000000081','00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000005/example/unrelated-jabatan.pdf',
  'SK jabatan sebelumnya non jabfung.pdf',281492,'application/pdf','SK_JABATAN_SEBELUMNYA');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $test_legacy$
declare old_count bigint;new_count bigint;
begin
 if not exists(select 1 from public.smartgtk_cabinet_candidates('SK_JF')
    where file_id='00000000-0000-4000-8000-000000000080') then
   raise exception 'FAIL: legacy SK JABFUNG TERAKHIR not offered';end if;
 if exists(select 1 from public.smartgtk_cabinet_candidates('SK_JF')
    where file_id='00000000-0000-4000-8000-000000000081') then
   raise exception 'FAIL: unrelated SK_JABATAN_SEBELUMNYA offered';end if;
 if exists(select 1 from public.smartgtk_cabinet_candidates('SK_KP')
    where file_id='00000000-0000-4000-8000-000000000080') then
   raise exception 'FAIL: legacy SK JF offered as SK Pangkat';end if;
 begin
   perform public.smartgtk_import_cabinet('SK_JF','00000000-0000-4000-8000-000000000081');
   raise exception 'FAIL: unrelated SK Jabatan accepted';
 exception when others then
   if position('Jenis dokumen di lemari tidak sesuai' in sqlerrm)=0 then raise;end if;
 end;
 select count(*) into old_count from storage.objects where bucket_id='simantab-documents';
 perform public.smartgtk_import_cabinet('SK_JF','00000000-0000-4000-8000-000000000080');
 select count(*) into new_count from storage.objects where bucket_id='simantab-documents';
 if new_count<>old_count then raise exception 'FAIL: import copied document';end if;
 if not exists(select 1 from public.smartgtk_documents
   where owner_id=auth.uid() and doc_type='SK_JF'
   and cabinet_file_id='00000000-0000-4000-8000-000000000080'
   and source_bucket='simantab-documents') then
   raise exception 'FAIL: correct legacy SK not linked';end if;
 if (public.smartgtk_mass_status()->'missing') ? 'SK_JF' then
   raise exception 'FAIL: legacy SK JF link not counted by completeness status';end if;
end $test_legacy$;
-- A new account cannot see another user's candidate or bypass the legacy-code guard.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000006';
do $test_cross_account$
begin
 if exists(select 1 from public.smartgtk_cabinet_candidates('SK_JF')
    where file_id='00000000-0000-4000-8000-000000000080') then
   raise exception 'FAIL: legacy match leaked cross-account';end if;
end $test_cross_account$;
reset role;
select 'Legacy SK Jabfung Terakhir compatibility: PASS' as result;