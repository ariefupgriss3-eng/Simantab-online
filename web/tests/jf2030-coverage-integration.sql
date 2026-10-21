-- Tests coverage is not a qualification inference; synthetic CI only.
\set ON_ERROR_STOP on
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
set role authenticated;
do $summary$
declare j jsonb; n integer;
begin
 j:=public.jf2030_coverage_summary();
 if (j->>'active_approved_gtk_accounts')::integer<>2
  or (j->>'valid_nip_accounts')::integer<>2
  or (j->>'distinct_valid_nips')::integer<>2
  or (j->>'unambiguous_gtk_accounts')::integer<>2
  or (j->>'reported_unambiguous_accounts')::integer<>0
  or (j->>'unreported_unambiguous_accounts')::integer<>2 then
   raise exception 'FAIL: unexpected synthetic account coverage %',j;end if;
 select count(*) into n from public.jf2030_coverage_unreported(0,50);
 if n<>2 then raise exception 'FAIL: expected two unreported synthetic GTK';end if;
end $summary$;
-- GTK cannot call the Dinas-only roster.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $gtk_denial$
begin
 begin
  perform public.jf2030_coverage_summary();
  raise exception 'FAIL: GTK read officer summary';
 exception when others then
  if position('Hanya petugas Dinas' in sqlerrm)=0 then raise; end if;
 end;
 begin
  perform public.jf2030_coverage_unreported(0,50);
  raise exception 'FAIL: GTK read officer personal roster';
 exception when others then
  if position('Hanya petugas Dinas' in sqlerrm)=0 then raise; end if;
 end;
end $gtk_denial$;
-- Create a duplicate account for the same NIP in synthetic fixture.
reset role;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000005');
insert into public.profiles(id,role,account_channel,approval_status,is_active,nip)
values('00000000-0000-4000-8000-000000000005','GTK','GTK','APPROVED',true,'198001012006042001');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $duplicate$
declare j jsonb; n integer;
begin
 j:=public.jf2030_coverage_summary();
 if (j->>'active_approved_gtk_accounts')::integer<>3
 or (j->>'ambiguous_duplicate_nip_groups')::integer<>1
 or (j->>'ambiguous_duplicate_nip_accounts')::integer<>2
 or (j->>'unambiguous_gtk_accounts')::integer<>1
 or (j->>'unreported_unambiguous_accounts')::integer<>1
 then raise exception 'FAIL: duplicate NIP not quarantined %',j;end if;
 select count(*) into n from public.jf2030_coverage_unreported(0,50);
 if n<>1 then raise exception 'FAIL: duplicate NIP listed as an unreported person';end if;
end $duplicate$;
reset role;
delete from public.profiles where id='00000000-0000-4000-8000-000000000005';
delete from auth.users where id='00000000-0000-4000-8000-000000000005';
select 'Coverage synthetic identities, isolation and duplicates: PASS' as result;
