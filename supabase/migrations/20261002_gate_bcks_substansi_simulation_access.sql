-- Gate Simulasi Seleksi Substansi BCKS.
-- Default: CLOSED. Only Kabid can toggle through the server-side Edge Function.

create table if not exists public.bcks_substansi_access_control(
  singleton_key text primary key check (singleton_key = 'GLOBAL'),
  is_open boolean not null default false,
  opened_by uuid null references public.profiles(id) on delete set null,
  opened_at timestamptz null,
  updated_by uuid null references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  note text null
);

alter table public.bcks_substansi_access_control enable row level security;
revoke all on public.bcks_substansi_access_control from anon, authenticated;

insert into public.bcks_substansi_access_control(singleton_key,is_open,note)
values('GLOBAL',false,'Akses simulasi Seleksi Substansi BCKS ditutup sampai dibuka oleh Kabid.')
on conflict(singleton_key) do update
set is_open=false,
    opened_by=null,
    opened_at=null,
    updated_at=now(),
    note='Akses simulasi Seleksi Substansi BCKS ditutup sampai dibuka oleh Kabid.';

drop policy if exists bcks_attempts_insert on public.bcks_substansi_attempts;
create policy bcks_attempts_insert on public.bcks_substansi_attempts
for insert to authenticated
with check(
  user_id=(select auth.uid())
  and exists(
    select 1
    from public.ks_bcks_submission_details d
    where d.user_id=(select auth.uid())
      and coalesce(d.is_archived,false)=false
      and d.workflow_stage in ('SUBSTANSI','DIKLAT','SERTIFIKAT')
      and d.admin_status in ('TERVERIFIKASI','DISETUJUI')
  )
  and exists(
    select 1
    from public.bcks_substansi_access_control c
    where c.singleton_key='GLOBAL'
      and c.is_open=true
  )
);
