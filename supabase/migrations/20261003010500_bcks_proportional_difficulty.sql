-- Proportional difficulty blueprint, preserving previous attempts' packages.
alter table public.bcks_substansi_attempts add column package_questions smallint[];
create or replace function private.bcks_thinking_questions(level_no smallint)
returns smallint[] language sql immutable set search_path='' as $$
 select case level_no
 when 1 then array[101,102,103,104,105,106,107,2,4,5,6,8,9,202,115,116,117,118,119,120,121,15,17,18,19,21,22,216,129,130,131,132,133,134,135,31,32,33,34,35,37,229,143,144,145,146,147,148,149,43,44,45,46,47,243,244,157,158,159,160,161,162,163,58,60,61,62,63,257,258]::smallint[]
 when 2 then array[108,109,110,111,11,12,13,14,201,204,203,205,206,207,122,123,124,125,23,25,27,28,215,217,219,221,223,224,136,137,138,139,38,39,41,42,230,231,232,234,235,236,150,151,152,153,49,51,52,54,56,245,246,247,249,250,164,165,166,167,168,64,65,67,68,69,259,260,261,262]::smallint[]
 when 3 then array[112,113,114,210,213,208,209,211,212,214,1,3,7,10,126,127,128,218,220,222,225,226,227,228,16,20,24,26,140,141,142,233,238,242,237,239,240,241,29,30,36,40,154,155,156,248,252,256,251,253,254,255,48,50,53,55,169,170,264,267,269,263,265,266,268,270,57,59,66,70]::smallint[]
 else array(select generate_series(1,70)::smallint) end;
$$;
create or replace function private.bcks_stamp_package()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  new.package_questions:=private.bcks_thinking_questions(new.session_level);
 else
  new.package_questions:=old.package_questions;
 end if;
 return new;
end;
$$;
revoke all on function private.bcks_stamp_package() from public,anon,authenticated;
create trigger bcks_stamp_package before insert or update on public.bcks_substansi_attempts for each row execute function private.bcks_stamp_package();
create or replace function private.bcks_thinking_answer_guard()
returns trigger language plpgsql security definer set search_path='' as $$
declare a public.bcks_substansi_attempts; allowed smallint[];
begin
 if auth.uid() is null or new.user_id<>auth.uid() then raise exception 'Unauthorized'; end if;
 select * into a from public.bcks_substansi_attempts where id=new.attempt_id and user_id=auth.uid();
 if not found or a.status<>'IN_PROGRESS' or now()>a.expires_at then raise exception 'Attempt unavailable'; end if;
 allowed:=coalesce(a.package_questions,array(select generate_series(case a.session_level when 1 then 101 when 3 then 201 else 1 end,case a.session_level when 1 then 170 when 3 then 270 else 70 end)::smallint));
 if not(new.question_no=any(allowed)) then raise exception 'Question outside session package'; end if;
 if a.mode='COACH' and not exists(select 1 from public.bcks_substansi_answer_keys k where k.question_no=new.question_no and k.competency=a.target_competency) then raise exception 'Question outside coach competency'; end if;
 return new;
end;
$$;
