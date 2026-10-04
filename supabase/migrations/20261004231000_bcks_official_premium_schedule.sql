-- Official SIMANTAB BCKS schedule (Asia/Jakarta/WIB).
-- Premium One: 5 Oct 2026 13:00-16:00
-- Premium Two: 8 Oct 2026 13:00-16:00
-- Pro: 10 Oct 2026 09:00-12:00
-- Basic remains historical level 1. Level 30 remains isolated Premium Two test access.

alter table public.bcks_substansi_attempts
  drop constraint if exists bcks_substansi_attempts_session_level_check;
alter table public.bcks_substansi_attempts
  add constraint bcks_substansi_attempts_session_level_check
  check ((session_level between 0 and 4) or session_level=30);

alter table public.bcks_substansi_test_access
  drop constraint if exists bcks_substansi_test_access_session_level_check;
alter table public.bcks_substansi_test_access
  add constraint bcks_substansi_test_access_session_level_check
  check ((session_level between 1 and 4) or session_level=30);

create or replace function private.bcks_session_start(level_no smallint)
returns timestamptz language sql immutable security invoker set search_path='' as $$
 select case level_no
   when 1 then '2026-10-03 09:00:00+07'::timestamptz
   when 2 then '2026-10-05 13:00:00+07'::timestamptz
   when 3 then '2026-10-08 13:00:00+07'::timestamptz
   when 4 then '2026-10-10 09:00:00+07'::timestamptz
   else null::timestamptz
 end;
$$;

create or replace function private.bcks_session_end(level_no smallint)
returns timestamptz language sql immutable security invoker set search_path='' as $$
 select case level_no
   when 1 then '2026-10-03 15:00:00+07'::timestamptz
   when 2 then '2026-10-05 16:00:00+07'::timestamptz
   when 3 then '2026-10-08 16:00:00+07'::timestamptz
   when 4 then '2026-10-10 12:00:00+07'::timestamptz
   else null::timestamptz
 end;
$$;

create or replace function private.bcks_thinking_level(at_time timestamptz)
returns smallint language sql immutable security invoker set search_path='' as $$
 select case
   when at_time >= private.bcks_session_start(1::smallint) and at_time < private.bcks_session_end(1::smallint) then 1
   when at_time >= private.bcks_session_start(2::smallint) and at_time < private.bcks_session_end(2::smallint) then 2
   when at_time >= private.bcks_session_start(3::smallint) and at_time < private.bcks_session_end(3::smallint) then 3
   when at_time >= private.bcks_session_start(4::smallint) and at_time < private.bcks_session_end(4::smallint) then 4
   else 0
 end::smallint;
$$;

create or replace function private.bcks_thinking_questions(level_no smallint)
returns smallint[] language sql immutable security invoker set search_path='' as $$
 select case level_no
   when 1 then array[101,102,103,104,105,106,107,2,4,5,6,8,9,202,115,116,117,118,119,120,121,15,17,18,19,21,22,216,129,130,131,132,133,134,135,31,32,33,34,35,37,229,143,144,145,146,147,148,149,43,44,45,46,47,243,244,157,158,159,160,161,162,163,58,60,61,62,63,257,258]::smallint[]
   when 2 then array[1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070]::smallint[]
   when 3 then array[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070]::smallint[]
   when 4 then array[112,113,114,210,213,208,209,211,212,214,1,3,7,10,126,127,128,218,220,222,225,226,227,228,16,20,24,26,140,141,142,233,238,242,237,239,240,241,29,30,36,40,154,155,156,248,252,256,251,253,254,255,48,50,53,55,169,170,264,267,269,263,265,266,268,270,57,59,66,70]::smallint[]
   when 30 then array[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070]::smallint[]
   else array(select generate_series(1,70)::smallint)
 end;
$$;

create or replace function private.bcks_effective_level()
returns smallint language sql stable security definer set search_path='' as $$
 select coalesce(
   (select session_level from public.bcks_substansi_test_access
     where user_id=auth.uid() and now()>=starts_at and now()<expires_at),
   private.bcks_thinking_level(now())
 );
$$;

create or replace function private.bcks_attempt_deadline()
returns timestamptz language sql stable security definer set search_path='' as $$
 select coalesce(
   (select expires_at from public.bcks_substansi_test_access
     where user_id=auth.uid() and now()>=starts_at and now()<expires_at),
   private.bcks_session_end(private.bcks_thinking_level(now()))
 );
$$;

create or replace function private.bcks_thinking_access()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
   exists(select 1 from public.bcks_substansi_test_access
     where user_id=auth.uid() and now()>=starts_at and now()<expires_at)
   or (
     private.bcks_thinking_level(now())>0
     and coalesce((
       select case
         when c.updated_at >= private.bcks_session_start(private.bcks_thinking_level(now()))
           then c.is_open else true end
       from public.bcks_substansi_access_control c
       where c.singleton_key='GLOBAL'
     ),false)
   )
 );
$$;

revoke all on function private.bcks_session_start(smallint), private.bcks_session_end(smallint),
 private.bcks_thinking_level(timestamptz), private.bcks_thinking_questions(smallint)
 from public,anon;
grant execute on function private.bcks_session_start(smallint), private.bcks_session_end(smallint),
 private.bcks_thinking_level(timestamptz), private.bcks_thinking_questions(smallint)
 to authenticated,service_role;
revoke all on function private.bcks_effective_level(), private.bcks_attempt_deadline(), private.bcks_thinking_access()
 from public,anon;
grant execute on function private.bcks_effective_level(), private.bcks_attempt_deadline(), private.bcks_thinking_access()
 to authenticated;

drop index if exists public.uq_bcks_one_official_result_per_level;
create unique index uq_bcks_one_official_result_per_level
on public.bcks_substansi_attempts(user_id,session_level)
where mode='SIMULASI'
  and session_level in (2,3,4)
  and coalesce(is_test,false)=false
  and status='SUBMITTED'
  and is_official_result=true;

create or replace function private.bcks_single_scheduled_attempt_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.mode <> 'SIMULASI'
     or new.session_level not in (2,3,4)
     or coalesce(new.is_test,false)=true then
    return new;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text || ':' || new.session_level::text, 0)
  );
  if exists(
    select 1 from public.bcks_substansi_attempts a
    where a.user_id=new.user_id
      and a.mode='SIMULASI'
      and a.session_level=new.session_level
      and coalesce(a.is_test,false)=false
  ) then
    raise exception using errcode='P0001',
      message='Sesi Premium/Pro hanya dapat dikerjakan satu kali per level.';
  end if;
  return new;
end;
$$;

create or replace function private.bcks_assign_official_result()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.mode='SIMULASI'
     and coalesce(new.is_test,false)=false
     and new.session_level in (2,3,4)
     and new.status='SUBMITTED' then
    if exists(
      select 1 from public.bcks_substansi_attempts a
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
    if new.session_level=1 then new.official_exclusion_reason:=null; end if;
    new.officialized_at:=null;
  end if;
  return new;
end;
$$;
