create or replace function private.bcks_single_scheduled_attempt_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.mode <> 'SIMULASI'
     or new.session_level not in (2,3)
     or coalesce(new.is_test,false)=true then
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
      and coalesce(a.is_test,false)=false
  ) then
    raise exception using
      errcode='P0001',
      message='Sesi Premium/Pro hanya dapat dikerjakan satu kali.';
  end if;

  return new;
end;
$$;
