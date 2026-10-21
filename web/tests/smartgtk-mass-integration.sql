-- SMART-GTK mass eligibility / private document QA: synthetic PostgreSQL only.
\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000005';
do $classification$
declare x jsonb;y jsonb;z jsonb;
begin
 x:=public.smartgtk_mass_classify('GURU','PNS','YA','TIDAK','TIDAK','DII','Guru Muda');
 y:=public.smartgtk_mass_classify('TENDIK','PNS','YA','TIDAK','YA','S1','Guru Muda');
 z:=public.smartgtk_mass_classify('GURU','PPPK','TIDAK','TIDAK_BERLAKU','TIDAK','S1','');
 if x->>'nomenklatur'<>'POTENSI_USUL' then raise exception 'FAIL: eligible PNS teacher not screened';end if;
 if y->>'pengangkatan'<>'DATABASE_ONLY' or z->>'nomenklatur'<>'DATABASE_ONLY' then
  raise exception 'FAIL: ineligible GTK placed into JF proposal candidates';end if;
end $classification$;
select public.smartgtk_mass_save('GURU','PNS','YA','Guru Muda','TIDAK','TIDAK',
 'DII','BELUM_KULIAH','','',null,'2030-05-11',null,'Data sintetis');
do $initial$
declare a jsonb;
begin
 a:=public.smartgtk_mass_status();
 if (a->>'complete')::boolean=true or jsonb_array_length(a->'missing')<>3 then
  raise exception 'FAIL: PNS document completeness accepted too early %',a;end if;
 if a->>'evidence_policy'<>'WAJIB' then raise exception 'FAIL: PNS evidence should be mandatory';end if;
 begin
  perform public.smartgtk_mass_complete();
  raise exception 'FAIL: incomplete PNS finalized';
 exception when others then
  if position('Berkas PNS belum lengkap' in sqlerrm)=0 then raise;end if;
 end;
end $initial$;
-- Mock uploaded objects; storage SQL RLS rejects unrelated users, and registration checks ownership.
insert into storage.objects(bucket_id,name) values
 ('simantab-smartgtk-private','00000000-0000-4000-8000-000000000005/SK_KP/00000000-0000-4000-8000-000000000051.pdf'),
 ('simantab-smartgtk-private','00000000-0000-4000-8000-000000000005/IJAZAH_TERAKHIR/00000000-0000-4000-8000-000000000052.pdf'),
 ('simantab-smartgtk-private','00000000-0000-4000-8000-000000000005/SK_JF/00000000-0000-4000-8000-000000000053.pdf');
select public.smartgtk_mass_register_file('SK_KP','00000000-0000-4000-8000-000000000005/SK_KP/00000000-0000-4000-8000-000000000051.pdf');
select public.smartgtk_mass_register_file('IJAZAH_TERAKHIR','00000000-0000-4000-8000-000000000005/IJAZAH_TERAKHIR/00000000-0000-4000-8000-000000000052.pdf');
select public.smartgtk_mass_register_file('SK_JF','00000000-0000-4000-8000-000000000005/SK_JF/00000000-0000-4000-8000-000000000053.pdf');
select public.smartgtk_mass_complete();
do $completed$
begin
 if not exists(select 1 from public.smartgtk_intake where owner_id=auth.uid()
 and data_stage='BERKAS_LENGKAP') then raise exception 'FAIL: complete PNS not marked with proper stage';end if;
 if (select jsonb_array_length(public.smartgtk_mass_status()->'missing'))<>0 then
  raise exception 'FAIL: PNS missing documents after upload';end if;
end $completed$;
-- Form updates must invalidate previous complete status.
select public.smartgtk_mass_save('GURU','PNS','YA','Guru Muda','TIDAK','TIDAK',
 'DII','BELUM_KULIAH','','',null,'2030-05-11',null,'SK penyesuaian baru');
do $reset_stage$
begin
 if not exists(select 1 from public.smartgtk_intake where owner_id=auth.uid() and data_stage='DRAFT')
 then raise exception 'FAIL: stale complete status after user update'; end if;
end $reset_stage$;
-- PPPK is stored as database only, with no mandatory JF SK evidence.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000007';
select public.smartgtk_mass_save('GURU','PPPK','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'SPG','BELUM_KULIAH','','',null,null,null,'PPPK real data');
do $pppk$
declare a jsonb;
begin
 a:=public.smartgtk_mass_status();
 if a->>'evidence_policy'<>'SESUAI_DOKUMEN_DIMILIKI'
 or jsonb_array_length(a->'required')<>0
 then raise exception 'FAIL: PPPK documents improperly required %',a;end if;
 if public.smartgtk_mass_classify('GURU','PPPK','TIDAK','TIDAK_BERLAKU','TIDAK','S1','')->>'pengangkatan'<>'DATABASE_ONLY'
 then raise exception 'FAIL: PPPK screen as PNS';end if;
end $pppk$;
select public.smartgtk_mass_complete();
-- Non-ASN can never upload and must finish without evidence.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000010';
select public.smartgtk_mass_save('TENDIK','NON_ASN','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'DIII','SEDANG_KULIAH','Universitas Uji','PGPAUD',2025,'2030-04-01',null,'Non-ASN');
do $nonasn$
begin
 if public.smartgtk_mass_status()->>'evidence_policy'<>'TANPA_UNGGAH'
 then raise exception 'FAIL: nonASN evidence policy incorrect';end if;
 begin
  perform public.smartgtk_mass_register_file('IJAZAH_TERAKHIR',
    '00000000-0000-4000-8000-000000000010/IJAZAH_TERAKHIR/00000000-0000-4000-8000-000000000010.pdf');
  raise exception 'FAIL: non ASN upload accepted';
 exception when others then
  if position('tidak mengunggah dokumen' in sqlerrm)=0 then raise;end if;
 end;
end $nonasn$;
select public.smartgtk_mass_complete();
-- Pengawas uses existing DINAS-channel login, but cannot become JF Guru proposal subject.
reset role;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000011');
insert into public.profiles(id,role,account_channel,approval_status,is_active,nip,full_name,unit_gtk)
values('00000000-0000-4000-8000-000000000011','PENGAWAS','DINAS','APPROVED',true,'197001012006042011','Pengawas Sintetis','Dinas Uji');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.smartgtk_pilot_assign('00000000-0000-4000-8000-000000000011',true);
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';
select public.smartgtk_mass_save('PENGAWAS','PNS','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'S2','SUDAH_MEMENUHI','Universitas Uji','Manajemen',2013,null,'2017-07-01','Pengawas');
do $watcher$
begin
 if not exists(select 1 from public.smartgtk_intake where owner_id=auth.uid()
 and profession='PENGAWAS' and employment='PNS')then raise exception 'FAIL: pengawas login not supported';end if;
 if public.smartgtk_mass_classify('PENGAWAS','PNS','YA','TIDAK','YA','S2','Guru Muda')->>'nomenklatur'<>'DATABASE_ONLY'
 then raise exception 'FAIL: PNS pengawas classified as teacher JF';end if;
end $watcher$;
-- Dinas officer sees role and evidence status, but one GTK cannot access other uploads.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $officer$
begin
 if not exists(select 1 from public.smartgtk_mass_officer_list(0) where profession='PENGAWAS')
 then raise exception 'FAIL: officer cannot monitor pengawas';end if;
end $officer$;
select 'SMARTGTK mass cohorts and document policy tests PASS' as result;
