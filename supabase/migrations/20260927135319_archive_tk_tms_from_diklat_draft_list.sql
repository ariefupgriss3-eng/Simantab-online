alter table public.ks_bcks_submission_details
  add column if not exists is_archived boolean not null default false,
  add column if not exists archive_reason text,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

with kabid as (
  select id
  from public.profiles
  where role='KABID'
    and is_active=true
    and coalesce(account_channel,'DINAS')='DINAS'
  order by id
  limit 1
),
targets as (
  select d.submission_id
  from public.ks_bcks_submission_details d
  join public.submissions s on s.id=d.submission_id
  where d.submission_id in (
    'bdd0bd2f-cb5a-46fc-a96b-9367d406308c',
    '49049061-150b-4b03-8def-8e0f6b9b23a8',
    'adc32d1c-ad52-4804-a5d8-2dc7556a774a',
    '04d39ae0-1005-4236-a889-06e8b01a6474'
  )
    and s.service_type='DIKLAT_KS_BCKS'
    and s.scope_level='TK_PAUD_PNF'
    and d.admin_status='DRAFT'
    and upper(coalesce(d.admin_note,'')) like '%TMS%'
)
update public.ks_bcks_submission_details d
set is_archived=true,
    archive_reason='TMS — dikeluarkan dari daftar peserta Diklat KS/BCKS.',
    archived_at=clock_timestamp(),
    archived_by=(select id from kabid),
    updated_at=clock_timestamp()
where d.submission_id in (select submission_id from targets);

insert into public.submission_events(submission_id,status,note,actor_id)
select d.submission_id,
       'TMS_DIARSIPKAN',
       'Peserta TK berstatus TMS dikeluarkan dari daftar Draft Diklat KS/BCKS. Data tidak dihapus permanen dan tetap disimpan untuk audit.',
       d.archived_by
from public.ks_bcks_submission_details d
where d.submission_id in (
  'bdd0bd2f-cb5a-46fc-a96b-9367d406308c',
  '49049061-150b-4b03-8def-8e0f6b9b23a8',
  'adc32d1c-ad52-4804-a5d8-2dc7556a774a',
  '04d39ae0-1005-4236-a889-06e8b01a6474'
)
  and d.is_archived=true
  and not exists (
    select 1 from public.submission_events e
    where e.submission_id=d.submission_id
      and e.status='TMS_DIARSIPKAN'
  );