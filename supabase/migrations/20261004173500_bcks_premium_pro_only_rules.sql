-- Restrict single-attempt and official-first-result rules to Premium (2) and Pro (3).
-- Basic (1) remains repeatable and is not subject to official-first-result marking.

update public.bcks_substansi_attempts
set is_official_result=false,
    official_exclusion_reason=null,
    officialized_at=null
where session_level=1;

drop index if exists public.uq_bcks_one_official_result_per_level;

create unique index uq_bcks_one_official_result_per_level
on public.bcks_substansi_attempts(user_id,session_level)
where mode='SIMULASI'
  and session_level in (2,3)
  and coalesce(is_test,false)=false
  and status='SUBMITTED'
  and is_official_result=true;

create or replace function private.bcks_single_scheduled_attempt_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.mode <> 'SIMULASI' or new.session_level not in (2,3) then
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
      message='Sesi Premium/Pro hanya dapat dikerjakan satu kali.';
  end if;

  return new;
end;
$$;

create or replace function private.bcks_assign_official_result()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.mode='SIMULASI'
     and coalesce(new.is_test,false)=false
     and new.session_level in (2,3)
     and new.status='SUBMITTED' then

    if exists(
      select 1
      from public.bcks_substansi_attempts a
      where a.user_id=new.user_id
        and a.session_level=new.session_level
        and a.mode='SIMULASI'
        and coalesce(a.is_test,false)=false
        and a.status='SUBMITTED'
        and a.is_official_result=true
        and a.id<>new.id
    ) then
      new.is_official_result:=false;
      new.official_exclusion_reason:=coalesce(new.official_exclusion_reason,'REPEAT_SUBMISSION_NOT_COUNTED');
      new.officialized_at:=null;
    else
      new.is_official_result:=true;
      new.official_exclusion_reason:=null;
      new.officialized_at:=coalesce(new.officialized_at,new.submitted_at,now());
    end if;
  else
    new.is_official_result:=false;
    if new.session_level=1 then
      new.official_exclusion_reason:=null;
    end if;
    new.officialized_at:=null;
  end if;

  return new;
end;
$$;
