\set ON_ERROR_STOP on
-- Owner candidate list: two valid files, exclude >1.5 MB, exclude all other owners.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $test_candidates$
declare n integer; obj text;
begin
 select count(*) into n from public.smartgtk_cabinet_candidates('SK_JF');
 if n<>2 then raise exception 'FAIL: cabinet list leaks other user or oversized file, count %',n;end if;
 if exists(select 1 from public.smartgtk_cabinet_candidates('SK_JF')
   where file_name='Private Other Person.pdf') then raise exception 'FAIL: cross-account cabinet filename visible';end if;
end $test_candidates$;
-- Import a selection without copying the storage object, while keeping completeness source-aware.
do $test_attach$
declare objects_before bigint; objects_after bigint;
begin
 select count(*) into objects_before from storage.objects where bucket_id='simantab-smartgtk-private';
 perform public.smartgtk_import_cabinet('SK_JF','00000000-0000-4000-8000-000000000051'::uuid);
 select count(*) into objects_after from storage.objects where bucket_id='simantab-smartgtk-private';
 if objects_before<>objects_after then raise exception 'FAIL: reusing cabinet copied objects';end if;
 if not exists(select 1 from public.smartgtk_documents
  where owner_id=auth.uid() and doc_type='SK_JF' and source_bucket='simantab-documents'
  and cabinet_file_id='00000000-0000-4000-8000-000000000051') then
   raise exception 'FAIL: cabinet source not recorded';end if;
 if (public.smartgtk_mass_status()->'missing') ? 'SK_JF' then
   raise exception 'FAIL: usable cabinet reference still missing';end if;
 if not exists(select 1 from public.smartgtk_audit
  where owner_id=auth.uid() and action='CABINET_FILE_LINKED_SK_JF') then
   raise exception 'FAIL: no audit for cabinet use';end if;
end $test_attach$;
-- Cross-owner guessing, unauthorized types and oversized objects all rejected.
do $test_attack$
begin
 begin
  perform public.smartgtk_import_cabinet('SK_KP','00000000-0000-4000-8000-000000000054'::uuid);
  raise exception 'FAIL: cross-owner file assigned';
 exception when others then
  if position('Dokumen bukan milik akun ini' in sqlerrm)=0 then raise;end if;
 end;
 begin
  perform public.smartgtk_import_cabinet('SK_KP','00000000-0000-4000-8000-000000000053'::uuid);
  raise exception 'FAIL: oversized cabinet file assigned';
 exception when others then
  if position('tidak memenuhi persyaratan' in sqlerrm)=0 then raise;end if;
 end;
end $test_attack$;
-- Source document disappears: it is no longer considered complete.
reset role;
delete from storage.objects where bucket_id='simantab-documents'
 and name='00000000-0000-4000-8000-000000000005/example/owner-sk.pdf';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $test_deleted$
begin
 if not (public.smartgtk_mass_status()->'missing') ? 'SK_JF' then
  raise exception 'FAIL: removed cabinet file counted as present';end if;
end $test_deleted$;
-- Non-ASN must not access the picker at all.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000010';
do $test_nonasn$
begin
 begin
  perform * from public.smartgtk_cabinet_candidates('IJAZAH_TERAKHIR');
  raise exception 'FAIL: NON_ASN can query cabinet import';
 exception when others then
  if position('tidak diperbolehkan' in sqlerrm)=0 then raise;end if;
 end;
end $test_nonasn$;
-- No account can access a complete cross-user catalog, and anon cannot call import RPC.
reset role;
do $test_public$
begin
 if has_function_privilege('anon','public.smartgtk_import_cabinet(text,uuid)','EXECUTE') then
  raise exception 'FAIL: anon may import cabinet evidence';end if;
end $test_public$;
select 'SMARTGTK Lemari Dokumenku safe references PASS' as result;
