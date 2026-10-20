-- PostgreSQL integration: actions run as authenticated simulated end users.
\set ON_ERROR_STOP on
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
set role authenticated;
-- Cannot replace own NIP with another user's NIP.
do $$
begin
 begin
  perform public.jf2026_save_case(null,'NOMENKLATUR','Guru Satu','198201012007042002','SD Negeri Test','Guru Madya','IV/a','S1',null,false,'');
  raise exception 'FAIL: NIP lain diterima';
 exception when others then
  if position('NIP harus sama' in sqlerrm)=0 then raise; end if;
 end;
end $$;
-- A case can be created only via RPC.
select public.jf2026_save_case(null,'NOMENKLATUR','Guru Satu','198001012006042001','SD Negeri Test','Guru Madya','IV/a','S1',null,false,'') as case_id \gset
do $$
begin
 begin
  insert into public.jf2026_cases(owner_id,pathway,full_name,nip,unit_work,education)
  values('00000000-0000-4000-8000-000000000001','PENGANGKATAN','Abuse','123456789012345678','School','S1');
  raise exception 'FAIL: direct table write allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
-- Missing mandatory documents cannot be submitted.
do $$
begin
 begin
  perform public.jf2026_submit_case((select id from public.jf2026_cases limit 1));
  raise exception 'FAIL: submission without documents accepted';
 exception when others then
  if position('Berkas wajib belum tersedia' in sqlerrm)=0 then raise; end if;
 end;
end $$;
-- Upload three genuine metadata links (content simulated in ephemeral storage).
insert into storage.objects(bucket_id,name) values
 ('simantab-jf-guru-2026','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/SK_JF-one.pdf'),
 ('simantab-jf-guru-2026','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/SK_KP-two.pdf'),
 ('simantab-jf-guru-2026','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/IJAZAH_TERAKHIR-three.pdf');
insert into public.jf2026_documents(case_id,code,storage_path,file_name,mime_type,file_size,uploaded_by) values
 (:'case_id'::uuid,'SK_JF','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/SK_JF-one.pdf','SK_JF.pdf','application/pdf',500,'00000000-0000-4000-8000-000000000001'),
 (:'case_id'::uuid,'SK_KP','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/SK_KP-two.pdf','SK_KP.pdf','application/pdf',500,'00000000-0000-4000-8000-000000000001'),
 (:'case_id'::uuid,'IJAZAH_TERAKHIR','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/IJAZAH_TERAKHIR-three.pdf','Ijazah.pdf','application/pdf',500,'00000000-0000-4000-8000-000000000001');
select public.jf2026_submit_case(:'case_id'::uuid);
-- Another GTK cannot read or modify the first user's data.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$
begin
 if exists (select 1 from public.jf2026_cases c where c.nip='198001012006042001') then raise exception 'FAIL: leaked other user case'; end if;
 if exists (select 1 from public.jf2026_documents) then raise exception 'FAIL: leaked other user document'; end if;
 begin
  perform public.jf2026_submit_case((select id from public.jf2026_cases where nip='198001012006042001'));
  raise exception 'FAIL: forbidden submission executed';
 exception when others then
  if position('Usulan tidak dapat dikirim' in sqlerrm)=0 then raise; end if;
 end;
end $$;
-- Staff may verify but must not sign off Kabid's approval stage.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000004';
select public.jf2026_transition(:'case_id'::uuid,'VERIFIED','Lengkap') as staff_verification;
do $$
begin
 begin
  perform public.jf2026_transition((select id from public.jf2026_cases limit 1),'DISETUJUI_DINAS','Persetujuan palsu');
  raise exception 'FAIL: staff approved Kabid stage';
 exception when others then
  if position('hanya oleh Kabid' in sqlerrm)=0 then raise; end if;
 end;
end $$;
-- Kabid approves, staff records BKPSDM evidence.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.jf2026_transition(:'case_id'::uuid,'DISETUJUI_DINAS','Disetujui secara administrasi');
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000004';
select public.jf2026_transition(:'case_id'::uuid,'DIKIRIM_BKPSDM','Nomor pengantar 001/2026');
-- Cannot fake an issued SK without scanned evidence.
do $$
begin
 begin
  perform public.jf2026_transition((select id from public.jf2026_cases limit 1),'SK_TERBIT','', '001/2026','2026-10-20');
  raise exception 'FAIL: issued status without evidence';
 exception when others then
  if position('Bukti SK penetapan belum diunggah' in sqlerrm)=0 then raise; end if;
 end;
end $$;
insert into storage.objects(bucket_id,name) values
 ('simantab-jf-guru-2026','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/SK_PENETAPAN-four.pdf');
insert into public.jf2026_documents(case_id,code,storage_path,file_name,mime_type,file_size,uploaded_by) values
 (:'case_id'::uuid,'SK_PENETAPAN','00000000-0000-4000-8000-000000000001/'||:'case_id'||'/SK_PENETAPAN-four.pdf','SK Resmi.pdf','application/pdf',600,'00000000-0000-4000-8000-000000000004');
select public.jf2026_transition(:'case_id'::uuid,'SK_TERBIT','Nomor SK diverifikasi','001/2026','2026-10-20');
select public.jf2026_register_export(1);
do $$
begin
 if (select count(*) from public.jf2026_events) < 5 then raise exception 'FAIL: missing audit trail'; end if;
 if (select status from public.jf2026_cases limit 1) <> 'SK_TERBIT' then raise exception 'FAIL: status not final'; end if;
 if not exists (select 1 from public.jf2026_export_audit) then raise exception 'FAIL: export not audited'; end if;
end $$;
select 'PostgreSQL integration: all assertions passed' as result;
