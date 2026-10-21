-- SMART-GTK synthetic integration: only ephemeral CI PostgreSQL, never run in production.
\set ON_ERROR_STOP on
reset role;
insert into auth.users(id) values
('00000000-0000-4000-8000-000000000005'),
('00000000-0000-4000-8000-000000000006'),
('00000000-0000-4000-8000-000000000007'),
('00000000-0000-4000-8000-000000000008');
insert into public.profiles(id,role,account_channel,approval_status,is_active,nip,full_name,unit_gtk) values
('00000000-0000-4000-8000-000000000005','GTK','GTK','APPROVED',true,'197001012006042005','Guru Uji Lima','SD Uji'),
('00000000-0000-4000-8000-000000000006','KEPALA_SEKOLAH','GTK','APPROVED',true,'197001012006042006','Guru Uji Enam','SD Uji'),
('00000000-0000-4000-8000-000000000007','GTK','GTK','APPROVED',true,'197001012006042007','Guru Uji Tujuh','SD Uji'),
('00000000-0000-4000-8000-000000000008','GTK','GTK','APPROVED',true,'197001012006042008','Guru Uji Delapan','SD Uji');
set role authenticated;
-- Existing JF SK + nomenclature not updated, while diploma unqualified -> TWO independent queues.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
select public.smartgtk_save('PNS','YA','Guru Muda','TIDAK','TIDAK',
 'DII','BELUM_KULIAH','','',null,'2030-05-11',null,'Data sintetis') as result \gset
do $test_dual$
declare x jsonb;
begin
 x:=public.smartgtk_classify('PNS','YA','TIDAK','TIDAK','DII','Guru Muda');
 if x->>'nomenklatur'<>'POTENSI_USUL' or x->>'pengangkatan'<>'TIDAK_TERINDIKASI'
 or x->>'kualifikasi'<>'PERLU_PEMENUHAN_2030' then
 raise exception 'FAIL: two independent routes %',x; end if;
 if not exists(select 1 from public.jf2030_qualification where owner_id=auth.uid() and education_initial='DII')
 then raise exception 'FAIL: unified intake not synced to education history';end if;
end $test_dual$;
-- PNS JF formation but no appointment SK, qualification S1 -> appointment route.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000006';
select public.smartgtk_save('PNS','TIDAK','','TIDAK_BERLAKU','YA',
 'S1','SUDAH_MEMENUHI','Univ Contoh','PGSD',2015,null,'2020-07-01','Data sintetis');
do $test_new$
declare x jsonb;
begin
 x:=public.smartgtk_classify('PNS','TIDAK','TIDAK_BERLAKU','YA','S1','');
 if x->>'pengangkatan'<>'POTENSI_USUL' or x->>'kualifikasi'<>'DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI'
 then raise exception 'FAIL: wrong appointment route %',x;end if;
end $test_new$;
-- Non-PNS cannot be identified as PNS-specific appointments.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000007';
select public.smartgtk_save('PPPK','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'SPG','BELUM_KULIAH','','',null,null,null,'Requires special legal review');
do $test_non_pns$
declare x jsonb;
begin
 x:=public.smartgtk_classify('PPPK','BELUM_TAHU','TIDAK_BERLAKU','TIDAK','SPG','');
 if x->>'nomenklatur'<>'TIDAK_TERINDIKASI' or x->>'pengangkatan'<>'TIDAK_TERINDIKASI'
 or x->>'kualifikasi'<>'TELAAH_KHUSUS' then raise exception 'FAIL: non-PNS route %',x;end if;
end $test_non_pns$;
-- Unknown records do not turn into an official proposal.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000008';
select public.smartgtk_save('PNS','BELUM_TAHU','','BELUM_TAHU','BELUM_TAHU',
 'DIII','SEDANG_KULIAH','Univ Uji','PGSD',2024,'2030-04-01',null,'Data incomplete');
do $test_unknown$
declare x jsonb;
begin
 x:=public.smartgtk_classify('PNS','BELUM_TAHU','BELUM_TAHU','BELUM_TAHU','DIII','');
 if x->>'nomenklatur'<>'PERLU_DATA' or x->>'pengangkatan'<>'PERLU_DATA'
 then raise exception 'FAIL: unknown SK must not be eligible %',x;end if;
end $test_unknown$;
-- Another GTK cannot browse unrelated intake or events.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $test_rls$
begin
 if (select count(*) from public.smartgtk_intake)<>1 then raise exception 'FAIL: cross GTK intake leak';end if;
 begin
  perform * from public.smartgtk_officer_list(0);
  raise exception 'FAIL: GTK can browse officer roster';
 exception when others then
  if position('Hanya petugas Dinas' in sqlerrm)=0 then raise;end if;
 end;
end $test_rls$;
-- Dinas cannot make submissions impersonating GTK, but can see the categorized roster.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $test_officer$
begin
 if (select count(*) from public.smartgtk_officer_list(0))<>4 then
  raise exception 'FAIL: Dinas roster does not include four submitted profiles';end if;
 begin
  perform public.smartgtk_save('PNS','TIDAK','','TIDAK_BERLAKU','YA',
  'S1','SUDAH_MEMENUHI','Univ','PGSD',2015,null,'2020-07-01','Impersonation');
  raise exception 'FAIL: Dinas wrote GTK intake';
 exception when others then
  if position('Hanya akun GTK' in sqlerrm)=0 then raise;end if;
 end;
end $test_officer$;
reset role;
-- Two active GTK accounts sharing a NIP: reject ambiguous person before saving.
insert into auth.users(id) values('00000000-0000-4000-8000-000000000009');
insert into public.profiles(id,role,account_channel,approval_status,is_active,nip)
values('00000000-0000-4000-8000-000000000009','GTK','GTK','APPROVED',true,'197001012006042008');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000008';
do $test_duplicates$
begin
 begin
  perform public.smartgtk_save('PNS','BELUM_TAHU','','BELUM_TAHU','BELUM_TAHU',
  'DIII','SEDANG_KULIAH','Univ Uji','PGSD',2024,'2030-04-01',null,'Duplicate NIP');
  raise exception 'FAIL: accepted duplicate active NIP';
 exception when others then
  if position('NIP terhubung dengan lebih dari satu akun' in sqlerrm)=0 then raise;end if;
 end;
end $test_duplicates$;
-- Non-ASN GTK may not have ASN NIP; still uses the same factual questionnaire.
reset role;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000010');
insert into public.profiles(id,role,account_channel,approval_status,is_active,nip,full_name,unit_gtk)
values('00000000-0000-4000-8000-000000000010','GTK','GTK','APPROVED',true,null,'Guru Non ASN Uji','TK Uji');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000010';
select public.smartgtk_save('NON_ASN','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'DIII','SEDANG_KULIAH','Universitas Uji','PGPAUD',2025,'2030-04-01',null,'Tanpa NIP ASN');
do $test_non_asn_no_nip$
begin
 if not exists(select 1 from public.smartgtk_intake
   where owner_id=auth.uid() and nip='' and employment='NON_ASN'
    and education='DIII') then
  raise exception 'FAIL: Non-ASN without NIP could not report education'; end if;
 if exists(select 1 from public.jf2030_qualification where owner_id=auth.uid()) then
  raise exception 'FAIL: Non-ASN without NIP falsely created legacy ASN education record';end if;
 begin
  perform public.smartgtk_save('PNS','BELUM_TAHU','','BELUM_TAHU','BELUM_TAHU',
    'DIII','SEDANG_KULIAH','Universitas Uji','PGSD',2025,'2030-04-01',null,'Invalid ASN NIP');
  raise exception 'FAIL: no-NIP account falsely treated as PNS';
 exception when others then
  if position('ASN harus melengkapi NIP' in sqlerrm)=0 then raise; end if;
 end;
end $test_non_asn_no_nip$;


-- An unrelated SK edit must not clear an officer request to correct diploma evidence.
reset role;
update public.jf2030_qualification set review_status='PERLU_PERBAIKAN',
 review_note='Perbaiki dokumen',updated_at=now()
 where owner_id='00000000-0000-4000-8000-000000000006';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000006';
select public.smartgtk_save('PNS','YA','Guru Pertama','TIDAK','TIDAK',
 'S1','SUDAH_MEMENUHI','Univ Contoh','PGSD',2015,null,'2020-07-01','Data sintetis');
do $test_review_retained$
begin
 if not exists(select 1 from public.jf2030_qualification where owner_id=auth.uid()
   and review_status='PERLU_PERBAIKAN' and review_note='Perbaiki dokumen') then
   raise exception 'FAIL: personnel edit erased diploma correction review';end if;
end $test_review_retained$;
-- Independently verified education cannot be rewritten by unified form.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $test_verified_protected$
begin
 begin
  perform public.smartgtk_save('PNS','YA','Guru Muda','TIDAK','TIDAK',
   'DI','LULUS_BELUM_VERIF','Univ Salah','PGSD',2025,'2030-04-15','2026-10-01','Not authorized');
  raise exception 'FAIL: verified education metadata overwritten';
 exception when others then
  if position('Ijazah terverifikasi berbeda' in sqlerrm)=0 then raise;end if;
 end;
end $test_verified_protected$;

select 'SMARTGTK synthetic classification and RLS PASS' as result;
