create or replace function private.bcks_stamp_server_expiry()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  hard_end timestamptz;
begin
  if new.mode='SIMULASI'
     and coalesce(new.is_test,false)=false
     and new.session_level in (2,3,4) then
    hard_end:=case new.session_level
      when 2 then timestamptz '2026-10-05 16:00:00+07'
      when 3 then timestamptz '2026-10-08 16:00:00+07'
      when 4 then timestamptz '2026-10-10 12:00:00+07'
      else null
    end;
    new.expires_at:=least(pg_catalog.now()+interval '120 minutes',hard_end);
  end if;
  return new;
end;
$$;

drop trigger if exists bcks_stamp_server_expiry on public.bcks_substansi_attempts;
create trigger bcks_stamp_server_expiry
before insert on public.bcks_substansi_attempts
for each row execute function private.bcks_stamp_server_expiry();

comment on function private.bcks_stamp_server_expiry() is
  'Uses database/server time for official Premium/Pro attempt expiry so device clock skew cannot shorten or extend the exam window.';
