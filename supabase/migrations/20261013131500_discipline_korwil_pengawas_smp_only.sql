-- SIMANTAB-ONLINE: eligible initiators of Pembinaan Disiplin / Perceraian
-- Requested 13 Oct 2026: only 15 Pimpinan Korwil (Pengawas SD) and Pengawas SMP.
-- Existing case monitoring / approvals and PROMOSI_KARIR inserts remain unchanged.
-- Fail closed if a district/name maps to zero or multiple active supervisors.
-- Rahayu Murdijati in submitted roster is RAHAJU MURDIJATI in existing profile;
-- Kabul in submitted roster is KABUL HINDARTO in existing profile.

create table if not exists public.discipline_submitter_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  submitter_kind text not null check (submitter_kind in ('KORWIL','PENGAWAS_SMP')),
  scope_level text not null check (scope_level in ('SD','SMP')),
  kecamatan text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint discipline_submitter_scope_consistent check (
    (submitter_kind='KORWIL' and scope_level='SD' and nullif(btrim(kecamatan),'') is not null)
    or
    (submitter_kind='PENGAWAS_SMP' and scope_level='SMP' and kecamatan is null)
  )
);
alter table public.discipline_submitter_grants enable row level security;
revoke all on public.discipline_submitter_grants from public, anon, authenticated;
grant select on public.discipline_submitter_grants to authenticated;
grant all on public.discipline_submitter_grants to service_role;
create policy discipline_submitter_read_own
  on public.discipline_submitter_grants for select to authenticated
  using (
    user_id=(select auth.uid())
    or (select private.current_role()) in ('KABID','SUPER_ADMIN')
  );

do $verify_authorized_roster$
declare v_bad integer; v_count integer;
begin
  with wanted(kecamatan,fullname_prefix) as (
    values
    ('Batang','SISWADI'), ('Kandeman','JUREMI'),
    ('Subah','RAHAJU MURDIJATI'), ('Banyuputih','RUSMANTO'),
    ('Gringsing','MINARTO'), ('Limpung','SULOMO'),
    ('Tersono','ASIM'), ('Bawang','ENI NURYANTI'),
    ('Blado','SUPRIYANTO'), ('Reban','KABUL'),
    ('Bandar','MULYONO'), ('Pecalungan','AGUS SUPRIANTO'),
    ('Wonotunggal','ASMUNI'), ('Warungasem','RUDIYANTO'),
    ('Tulis','COYO')
  ), matches as (
    select w.kecamatan,count(p.id) as matches
    from wanted w left join public.profiles p
      on upper(p.full_name) like w.fullname_prefix || '%'
     and p.role='PENGAWAS' and p.position='PENGAWAS SD'
     and p.account_channel='DINAS' and p.is_active=true
    group by w.kecamatan
  )
  select count(*) into v_bad from matches where matches<>1;
  if v_bad<>0 then
    raise exception 'Korwil roster has unmatched or ambiguous profile: % districts',v_bad;
  end if;

  select count(*) into v_count
  from public.profiles
  where role='PENGAWAS' and position='PENGAWAS SMP'
    and account_channel='DINAS' and is_active=true;
  if v_count<>4 then
    raise exception 'Expected exactly four active Pengawas SMP accounts, found %',v_count;
  end if;
end
$verify_authorized_roster$;

with wanted(kecamatan,fullname_prefix) as (
  values
  ('Batang','SISWADI'), ('Kandeman','JUREMI'),
  ('Subah','RAHAJU MURDIJATI'), ('Banyuputih','RUSMANTO'),
  ('Gringsing','MINARTO'), ('Limpung','SULOMO'),
  ('Tersono','ASIM'), ('Bawang','ENI NURYANTI'),
  ('Blado','SUPRIYANTO'), ('Reban','KABUL'),
  ('Bandar','MULYONO'), ('Pecalungan','AGUS SUPRIANTO'),
  ('Wonotunggal','ASMUNI'), ('Warungasem','RUDIYANTO'),
  ('Tulis','COYO')
)
insert into public.discipline_submitter_grants(user_id,submitter_kind,scope_level,kecamatan)
select p.id,'KORWIL','SD',w.kecamatan
from wanted w join public.profiles p
  on upper(p.full_name) like w.fullname_prefix || '%'
 and p.role='PENGAWAS' and p.position='PENGAWAS SD'
 and p.account_channel='DINAS' and p.is_active=true
on conflict(user_id) do nothing;

insert into public.discipline_submitter_grants(user_id,submitter_kind,scope_level,kecamatan)
select p.id,'PENGAWAS_SMP','SMP',null
from public.profiles p
where p.role='PENGAWAS' and p.position='PENGAWAS SMP'
  and p.account_channel='DINAS' and p.is_active=true
on conflict(user_id) do nothing;

create or replace function private.can_submit_sensitive_case(p_scope text)
returns boolean
language sql stable security definer
set search_path=pg_catalog
as $grant_check$
  select exists(
    select 1
    from public.discipline_submitter_grants g
    join public.profiles p on p.id=g.user_id
    where g.user_id=auth.uid()
      and g.is_active=true and p.is_active=true
      and p.role='PENGAWAS' and p.account_channel='DINAS'
      and g.scope_level=p_scope
      and (
        (g.submitter_kind='KORWIL' and p.position='PENGAWAS SD')
        or
        (g.submitter_kind='PENGAWAS_SMP' and p.position='PENGAWAS SMP')
      )
  )
$grant_check$;
revoke all on function private.can_submit_sensitive_case(text) from public;
grant execute on function private.can_submit_sensitive_case(text) to authenticated;

-- Preserve old INSERT behavior for promotion and other case types;
-- add a server-side rule ONLY for sensitive discipline/divorce proposals.
alter policy cases_insert on public.supervision_cases
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      case_type not in ('PEMBINAAN_DISIPLIN','PERCERAIAN')
      or private.can_submit_sensitive_case(scope_level)
    )
  );

-- Prevent changing another case into a sensitive proposal using UPDATE
-- (which would otherwise bypass the INSERT policy).
create or replace function private.prevent_sensitive_case_reclassification()
returns trigger
language plpgsql security definer
set search_path=pg_catalog
as $case_guard$
begin
  if (
     old.case_type in ('PEMBINAAN_DISIPLIN','PERCERAIAN')
     or new.case_type in ('PEMBINAAN_DISIPLIN','PERCERAIAN')
  ) and (
     old.case_type is distinct from new.case_type
     or old.scope_level is distinct from new.scope_level
     or old.created_by is distinct from new.created_by
  ) then
    raise exception 'Jenis, jenjang, dan pengusul kasus disiplin/perceraian tidak dapat dialihkan melalui pembaruan data.'
      using errcode='42501';
  end if;
  return new;
end
$case_guard$;
revoke all on function private.prevent_sensitive_case_reclassification() from public;
drop trigger if exists trg_prevent_sensitive_case_reclassification on public.supervision_cases;
create trigger trg_prevent_sensitive_case_reclassification
  before update of case_type,scope_level,created_by
  on public.supervision_cases
  for each row execute function private.prevent_sensitive_case_reclassification();

-- Fail-closed verification: all 19 distinct accounts must exist.
do $verify_grants$
declare v_k integer; v_s integer; v_total integer;
begin
  select count(*) filter(where submitter_kind='KORWIL'),
         count(*) filter(where submitter_kind='PENGAWAS_SMP'),
         count(*)
    into v_k,v_s,v_total
  from public.discipline_submitter_grants where is_active=true;
  if v_k<>15 or v_s<>4 or v_total<>19 then
    raise exception 'Unexpected authorizations: korwil %, SMP %, total %',v_k,v_s,v_total;
  end if;
end
$verify_grants$;
