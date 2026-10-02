create table public.bcks_substansi_test_access (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 session_level smallint not null check(session_level between 1 and 3),
 starts_at timestamptz not null default now(), expires_at timestamptz not null,
 check(expires_at>starts_at)
);
alter table public.bcks_substansi_test_access enable row level security;
revoke all on public.bcks_substansi_test_access from anon,authenticated;
grant all on public.bcks_substansi_test_access to service_role;
alter table public.bcks_substansi_attempts add column is_test boolean not null default false;
create or replace function private.bcks_effective_level()
returns smallint language sql stable security definer set search_path='' as $$
 select coalesce((select session_level from public.bcks_substansi_test_access where user_id=auth.uid() and now()>=starts_at and now()<expires_at),private.bcks_thinking_level(now()));
$$;
create or replace function private.bcks_attempt_deadline()
returns timestamptz language sql stable security definer set search_path='' as $$
 select coalesce((select expires_at from public.bcks_substansi_test_access where user_id=auth.uid() and now()>=starts_at and now()<expires_at),((now() at time zone 'Asia/Jakarta')::date+time '15:00') at time zone 'Asia/Jakarta');
$$;
create or replace function private.bcks_thinking_access()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (exists(select 1 from public.bcks_substansi_test_access where user_id=auth.uid() and now()>=starts_at and now()<expires_at)
 or (private.bcks_thinking_level(now())>0 and coalesce((select case when c.updated_at>=(((now() at time zone 'Asia/Jakarta')::date+time '09:00') at time zone 'Asia/Jakarta') then c.is_open else true end from public.bcks_substansi_access_control c where singleton_key='GLOBAL'),false)));
$$;
revoke all on function private.bcks_effective_level(),private.bcks_attempt_deadline() from public,anon;
grant execute on function private.bcks_effective_level(),private.bcks_attempt_deadline() to authenticated;
create or replace function private.bcks_mark_test_attempt()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.is_test:=exists(select 1 from public.bcks_substansi_test_access where user_id=new.user_id and now()>=starts_at and now()<expires_at);
 return new;
end;
$$;
revoke all on function private.bcks_mark_test_attempt() from public,anon,authenticated;
create trigger bcks_mark_test_attempt before insert on public.bcks_substansi_attempts for each row execute function private.bcks_mark_test_attempt();
drop policy if exists bcks_attempts_insert on public.bcks_substansi_attempts;
create policy bcks_attempts_insert on public.bcks_substansi_attempts for insert to authenticated with check(
 user_id=(select auth.uid()) and session_level=private.bcks_effective_level()
 and private.bcks_thinking_access() and expires_at<=private.bcks_attempt_deadline()
 and exists(select 1 from public.ks_bcks_submission_details d where d.user_id=(select auth.uid()) and coalesce(d.is_archived,false)=false and d.workflow_stage in ('SUBSTANSI','DIKLAT','SERTIFIKAT') and d.admin_status in ('TERVERIFIKASI','DISETUJUI')));
