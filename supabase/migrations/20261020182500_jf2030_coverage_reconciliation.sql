-- Officer-only reconciliation: SIMANTAB account coverage is NOT the complete Batang teacher census.
-- Never infer educational attainment from an unreported profile.
-- Profiles with duplicated NIP are excluded from person-specific outreach pending reconciliation.
-- Staging only; apply after jf2030_qualification_monitoring; do not auto-run in production.

create or replace function public.jf2030_coverage_summary()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not private.jf2026_is_officer() then
   raise exception 'Hanya petugas Dinas berwenang';
 end if;
 with active_profiles as (
   select p.id, p.nip
   from public.profiles p
   where p.account_channel='GTK'
     and p.role in ('GTK','KEPALA_SEKOLAH')
     and p.approval_status='APPROVED'
     and p.is_active=true
 ), valid_profiles as (
   select p.* from active_profiles p where p.nip ~ '^[0-9]{18}$'
 ), counts as (
   select nip,count(*) as n from valid_profiles group by nip
 ), unique_profiles as (
   select p.* from valid_profiles p join counts c on c.nip=p.nip and c.n=1
 ), statistics as (
   select
    (select count(*) from active_profiles) as active_accounts,
    (select count(*) from valid_profiles) as valid_nip_accounts,
    (select count(*) from counts) as distinct_nips,
    (select count(*) from counts where n>1) as duplicate_nip_groups,
    (select coalesce(sum(n),0) from counts where n>1) as duplicate_nip_accounts,
    (select count(*) from unique_profiles) as distinct_unambiguous_accounts,
    (select count(*) from unique_profiles p
       join public.jf2030_qualification q on q.owner_id=p.id and q.nip=p.nip) as reported_accounts
 )
 select jsonb_build_object(
    'active_approved_gtk_accounts',active_accounts,
    'valid_nip_accounts',valid_nip_accounts,
    'missing_or_invalid_nip_accounts',active_accounts-valid_nip_accounts,
    'distinct_valid_nips',distinct_nips,
    'ambiguous_duplicate_nip_groups',duplicate_nip_groups,
    'ambiguous_duplicate_nip_accounts',duplicate_nip_accounts,
    'unambiguous_gtk_accounts',distinct_unambiguous_accounts,
    'reported_unambiguous_accounts',reported_accounts,
    'unreported_unambiguous_accounts',distinct_unambiguous_accounts-reported_accounts,
    'scope','SIMANTAB_APPROVED_ACTIVE_ACCOUNTS_ONLY',
    'educational_status_unreported_is_unknown',true
 ) into result from statistics;
 return result;
end;
$$;

create or replace function public.jf2030_coverage_unreported(
 p_page integer default 0,p_limit integer default 50
)
returns table(profile_id uuid,full_name text,nip text,unit_work text,account_role text)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not private.jf2026_is_officer() then
   raise exception 'Hanya petugas Dinas berwenang';
 end if;
 if p_page is null or p_page<0 or p_page>10000 or p_limit is null or p_limit<1 or p_limit>50 then
   raise exception 'Halaman atau jumlah data tidak sah';
 end if;
 return query
 with valid_profiles as (
   select p.id,p.full_name,p.nip,p.unit,p.unit_gtk,p.role
   from public.profiles p
   where p.account_channel='GTK'
    and p.role in ('GTK','KEPALA_SEKOLAH')
    and p.approval_status='APPROVED'
    and p.is_active=true
    and p.nip ~ '^[0-9]{18}$'
 ), counts as (
   select p.nip,count(*) as n from valid_profiles p group by p.nip
 )
 select p.id,p.full_name,p.nip,
        coalesce(nullif(btrim(p.unit_gtk),''),nullif(btrim(p.unit),''),'Belum diisi') as unit_work,
        p.role
 from valid_profiles p
 join counts c on c.nip=p.nip and c.n=1
 where not exists (
   select 1 from public.jf2030_qualification q
   where q.owner_id=p.id and q.nip=p.nip
 )
 order by p.full_name nulls last,p.id
 limit p_limit offset (p_page::bigint*p_limit::bigint);
end;
$$;

revoke all on function public.jf2030_coverage_summary() from public,anon;
revoke all on function public.jf2030_coverage_unreported(integer,integer) from public,anon;
grant execute on function public.jf2030_coverage_summary() to authenticated;
grant execute on function public.jf2030_coverage_unreported(integer,integer) to authenticated;
comment on function public.jf2030_coverage_summary() is
 'Accounts and NIP identity quality only; not a statistic of teachers lacking S-1/D-IV.';
comment on function public.jf2030_coverage_unreported(integer,integer) is
 'Officer-only read of unmatched nonduplicate active approved GTK accounts; no education inference.';
