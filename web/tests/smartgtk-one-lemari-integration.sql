\set ON_ERROR_STOP on
-- Synthetic file uploaded once into the original private Lemari Dokumenku bucket.
reset role;
insert into storage.objects(bucket_id,name,metadata) values
 ('simantab-documents',
  '00000000-0000-4000-8000-000000000005/SMARTGTK/00000000-0000-4000-8000-000000000071.pdf',
  '{"size":820000,"mimetype":"application/pdf"}');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $test_one_file$
declare before_docs bigint; after_docs bigint; result_id uuid;
begin
 select count(*) into before_docs from public.submission_files;
 result_id:=public.smartgtk_locker_register('SK_KP',
  '00000000-0000-4000-8000-000000000005/SMARTGTK/00000000-0000-4000-8000-000000000071.pdf',
  'SK Pangkat Terakhir.pdf',820000,'application/pdf');
 if result_id is null then raise exception 'FAIL: no archive metadata';end if;
 select count(*) into after_docs from public.submission_files;
 if before_docs<>after_docs then raise exception 'FAIL: one-file upload created a fake service submission';end if;
 if not exists(select 1 from public.smartgtk_locker_files
  where id=result_id and owner_id=auth.uid() and doc_type='SK_KP') then
  raise exception 'FAIL: upload not in personal cabinet';end if;
 if not exists(select 1 from public.smartgtk_documents
  where owner_id=auth.uid() and doc_type='SK_KP' and cabinet_upload_id=result_id
    and source_bucket='simantab-documents') then
  raise exception 'FAIL: not linked to SMART-GTK';end if;
 if (public.smartgtk_mass_status()->'missing') ? 'SK_KP' then
  raise exception 'FAIL: document still absent from requirements';end if;
 if not exists(select 1 from public.smartgtk_cabinet_candidates('SK_KP') where file_id=result_id)
 then raise exception 'FAIL: new upload not reusable from cabinet picker';end if;
 perform public.smartgtk_import_cabinet('SK_KP',result_id);
end $test_one_file$;
-- Wrong account cannot see or reuse any other person's file.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000006';
do $test_isolation$
begin
 if exists(select 1 from public.smartgtk_locker_files
  where file_name='SK Pangkat Terakhir.pdf') then raise exception 'FAIL: cross-account document leak';end if;
 begin
  perform public.smartgtk_import_cabinet('SK_KP',
   '00000000-0000-4000-8000-000000000071'::uuid);
  raise exception 'FAIL: another account reused someone else file';
 exception when others then
  if position('Dokumen bukan milik akun ini' in sqlerrm)=0 then raise;end if;
 end;
end $test_isolation$;
-- Client metadata cannot lie about size; oversized and non-ASN attempts rejected.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $test_guard$
begin
 begin
  perform public.smartgtk_locker_register('SK_JF',
  '00000000-0000-4000-8000-000000000005/SMARTGTK/00000000-0000-4000-8000-000000000071.pdf',
  'fake.pdf',900000,'application/pdf');
  raise exception 'FAIL: forged file metadata accepted';
 exception when others then
  if position('Ukuran objek tidak cocok' in sqlerrm)=0 then raise;end if;
 end;
end $test_guard$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000010';
do $test_nonasn$
begin
 begin
  perform public.smartgtk_locker_register('SK_KP',
  '00000000-0000-4000-8000-000000000005/SMARTGTK/00000000-0000-4000-8000-000000000071.pdf',
  'forbidden.pdf',820000,'application/pdf');
  raise exception 'FAIL: NON_ASN upload accepted';
 exception when others then
  if position('Jenis berkas tidak diperbolehkan' in sqlerrm)=0 then raise;end if;
 end;
end $test_nonasn$;
reset role;
select 'SMARTGTK single Lemari Dokumenku upload PASS' as result;
