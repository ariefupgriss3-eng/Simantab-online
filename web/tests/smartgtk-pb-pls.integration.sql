\set ON_ERROR_STOP on
-- Tests run against isolated CI database; no personal data is touched.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000010';
-- Legacy unclassified records remain readable until the GTK chooses a specific category.
do $legacy$
begin
 if not exists(select 1 from public.smartgtk_intake
    where owner_id=auth.uid() and employment='NON_ASN') then
  raise exception 'FAIL: legacy category should be retained before explicit selection';end if;
end $legacy$;
-- PLS represents the services role and never requires or permits uploading evidence.
select public.smartgtk_mass_save('TENDIK','PLS','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'DIII','SEDANG_KULIAH','Universitas Uji','PGPAUD',2025,'2030-04-01',null,'Pendamping layanan');
do $pls$
declare s jsonb;
begin
 s:=public.smartgtk_mass_status();
 if s->>'employment'<>'PLS' or s->>'profession'<>'TENDIK'
   or s->>'evidence_policy'<>'TANPA_UNGGAH'
   or jsonb_array_length(s->'required')<>0
 then raise exception 'FAIL: PLS must be separate and document-free: %',s;end if;
 if not exists(select 1 from public.smartgtk_intake
    where owner_id=auth.uid() and employment='PLS') then
  raise exception 'FAIL: PLS code not stored';end if;
 if public.smartgtk_mass_classify('TENDIK','PLS','BELUM_TAHU','TIDAK_BERLAKU','TIDAK','DIII','')->>'pengangkatan'<>'DATABASE_ONLY' then
  raise exception 'FAIL: PLS entered ASN JF screening';end if;
 begin
  perform public.smartgtk_mass_save('GURU','PLS','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
   'DIII','SEDANG_KULIAH','Universitas Uji','PGPAUD',2025,'2030-04-01',null,'Invalid');
  raise exception 'FAIL: PLS accepted a teaching task';
 exception when others then
  if position('Pendamping Layanan Satpen' in sqlerrm)=0 then raise;end if;
 end;
end $pls$;
select public.smartgtk_mass_complete();
-- PB is a distinct code and similarly must not gain any document-upload rights.
select public.smartgtk_mass_save('GURU','PB','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
 'DIII','SEDANG_KULIAH','Universitas Uji','PGPAUD',2025,'2030-04-01',null,'Pendamping belajar');
do $pb$
declare s jsonb;
begin
 s:=public.smartgtk_mass_status();
 if s->>'employment'<>'PB' or s->>'profession'<>'GURU'
  or s->>'evidence_policy'<>'TANPA_UNGGAH'
  or jsonb_array_length(s->'required')<>0 then
  raise exception 'FAIL: PB must be separate and document-free: %',s;end if;
 if public.smartgtk_mass_classify('GURU','PB','BELUM_TAHU','TIDAK_BERLAKU','TIDAK','DIII','')->>'nomenklatur'<>'DATABASE_ONLY' then
  raise exception 'FAIL: PB entered PNS JF screening';end if;
 begin
  perform public.smartgtk_mass_save('TENDIK','PB','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
   'DIII','SEDANG_KULIAH','Universitas Uji','PGPAUD',2025,'2030-04-01',null,'Invalid');
  raise exception 'FAIL: PB accepted a services task';
 exception when others then
  if position('Pendamping Belajar' in sqlerrm)=0 then raise;end if;
 end;
 begin
  perform public.smartgtk_locker_register('IJAZAH_TERAKHIR',
    '00000000-0000-4000-8000-000000000010/SMARTGTK/00000000-0000-4000-8000-000000000010.pdf',
    'Not allowed.pdf',1200,'application/pdf');
  raise exception 'FAIL: PB may register document';
 exception when others then
  if position('Jenis berkas tidak diperbolehkan' in sqlerrm)=0 then raise;end if;
 end;
end $pb$;
select public.smartgtk_mass_complete();
-- Synthetic PNS headteacher cannot masquerade as pendamping categories.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000006';
do $ks_role$
begin
 begin
  perform public.smartgtk_mass_save('KEPALA_SEKOLAH','PB','BELUM_TAHU','','TIDAK_BERLAKU','TIDAK',
   'S1','SUDAH_MEMENUHI','Universitas Uji','PGSD',2017,null,'2021-01-15','Invalid');
  raise exception 'FAIL: PB assigned to kepala sekolah';
 exception when others then
  if position('Pendamping Belajar' in sqlerrm)=0 then raise;end if;
 end;
end $ks_role$;
reset role;
select 'PB/PLS distinct reporting categories: PASS' as result;
