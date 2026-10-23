-- Resolve SMART-GTK workflow jenjang using the authoritative NPSN first.
-- When NPSN is empty, use only a UNIQUE exact canonical school-name match
-- from the GTK's stated unit and the active Master Sekolah.
-- Never overwrite profiles.school_npsn, profession, permissions, or submitted data.

create or replace function private.smartgtk_school_name_key(p_name text)
returns text
language sql
immutable
set search_path = ''
as $fn$
select regexp_replace(
         regexp_replace(
           regexp_replace(
             regexp_replace(upper(btrim(coalesce(p_name,''))),
               '^SD[[:space:]]*NEGERI[[:space:]]+', 'SDN '),
             '^SMP[[:space:]]*NEGERI[[:space:]]+', 'SMPN '),
           '^SMPN[[:space:]]+0+([1-9][0-9]*)[[:space:]]+', 'SMPN \1 '),
         '[^A-Z0-9]', '', 'g');
$fn$;

revoke all on function private.smartgtk_school_name_key(text) from public, anon, authenticated;

create or replace function private.smartgtk_scope_for_owner(p_owner uuid)
returns text
language sql
stable
set search_path = ''
as $fn$
with owner_info as (
  select p.school_npsn,
    coalesce(nullif(btrim(p.unit_gtk),''),
             nullif(btrim(p.unit),''),
             nullif(btrim(i.unit_work),'')) as unit_name
  from public.profiles p
  left join public.smartgtk_intake i on i.owner_id=p.id
  where p.id=p_owner
), by_npsn as (
  select s.jenjang,s.bentuk_pendidikan
  from owner_info o
  join public.school_master s on s.npsn=o.school_npsn and s.is_active=true
), by_name as (
  select s.jenjang,s.bentuk_pendidikan,count(*) over() as match_count
  from owner_info o
  join public.school_master s on s.is_active=true
    and length(private.smartgtk_school_name_key(o.unit_name))>0
    and private.smartgtk_school_name_key(s.school_name)=private.smartgtk_school_name_key(o.unit_name)
), selected_school as (
  select jenjang,bentuk_pendidikan from by_npsn
  union all
  select jenjang,bentuk_pendidikan from by_name
  where match_count=1 and not exists(select 1 from by_npsn)
)
select coalesce((
  select case
    when upper(btrim(coalesce(nullif(jenjang,''),bentuk_pendidikan,'')))='SD'
      then 'SD'
    when upper(btrim(coalesce(nullif(jenjang,''),bentuk_pendidikan,'')))='SMP'
      then 'SMP'
    when upper(btrim(coalesce(nullif(jenjang,''),bentuk_pendidikan,''))) in
         ('TK','PAUD','KB','SPS','TPA','PKBM','SKB','PNF','PENDIDIKAN NONFORMAL')
      then 'TK_PAUD_PNF'
    else 'BELUM_TERPETAKAN'
  end from selected_school limit 1
), 'BELUM_TERPETAKAN');
$fn$;

-- New records use the enhanced scope automatically. Existing unresolved
-- records should also self-heal when an authorized reviewer opens the queue.
create or replace function private.smartgtk_workflow_sync()
returns void
language plpgsql
set search_path = ''
as $fn$
begin
  insert into public.smartgtk_workflow(owner_id,scope,status,source_updated_at)
  select i.owner_id,private.smartgtk_scope_for_owner(i.owner_id),
    'MENUNGGU_PENUGASAN',i.updated_at
  from public.smartgtk_intake i
  where i.employment='PNS'
    and i.profession in ('GURU','KEPALA_SEKOLAH')
    and i.data_stage in ('BERKAS_LENGKAP','DATA_TERCATAT')
  on conflict(owner_id) do nothing;

  -- Preserve manually confirmed or already routed scopes. Only repair UNKNOWN.
  update public.smartgtk_workflow w
    set scope=private.smartgtk_scope_for_owner(w.owner_id),
        updated_at=now(),
        version=w.version+1
  where w.scope='BELUM_TERPETAKAN'
    and private.smartgtk_scope_for_owner(w.owner_id) in ('SD','SMP','TK_PAUD_PNF');

  -- Keep existing review reset logic: only when source intake changes.
  update public.smartgtk_workflow w set
    status=case when i.data_stage in ('BERKAS_LENGKAP','DATA_TERCATAT')
      then case when w.assigned_staff is not null
                     and w.scope<>'BELUM_TERPETAKAN'
        then 'MENUNGGU_STAF' else 'MENUNGGU_PENUGASAN' end
      else 'MENUNGGU_DATA' end,
    source_updated_at=i.updated_at,
    staff_note=null,coordinator_note=null,kabid_note=null,
    decided_by=null,decided_at=null,
    version=w.version+1,updated_at=now()
  from public.smartgtk_intake i
  where i.owner_id=w.owner_id
    and i.employment='PNS'
    and i.profession in ('GURU','KEPALA_SEKOLAH')
    and i.updated_at>w.source_updated_at;
end;
$fn$;

-- Reconcile only unresolved live rows; preserve prior officer decisions.
update public.smartgtk_workflow w
  set scope=private.smartgtk_scope_for_owner(w.owner_id),
      updated_at=now(),version=w.version+1
where w.scope='BELUM_TERPETAKAN'
  and private.smartgtk_scope_for_owner(w.owner_id) in ('SD','SMP','TK_PAUD_PNF');
