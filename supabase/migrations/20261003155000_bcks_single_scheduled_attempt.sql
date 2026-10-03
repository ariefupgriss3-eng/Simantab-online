-- Enforce one scheduled SIMULASI attempt per participant per session level.
-- Existing historical duplicate rows are preserved; the guard applies to future inserts.

create or replace function private.bcks_single_scheduled_attempt_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.mode <> 'SIMULASI' or new.session_level not between 1 and 3 then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text || ':' || new.session_level::text, 0)
  );

  if exists(
    select 1
    from public.bcks_substansi_attempts a
    where a.user_id = new.user_id
      and a.mode = 'SIMULASI'
      and a.session_level = new.session_level
  ) then
    raise exception using
      errcode='P0001',
      message='Sesi terjadwal level ini hanya dapat dikerjakan satu kali.';
  end if;

  return new;
end;
$$;

revoke all on function private.bcks_single_scheduled_attempt_guard() from public, anon, authenticated;

drop trigger if exists zz_bcks_single_scheduled_attempt_guard on public.bcks_substansi_attempts;
create trigger zz_bcks_single_scheduled_attempt_guard
before insert on public.bcks_substansi_attempts
for each row
execute function private.bcks_single_scheduled_attempt_guard();
