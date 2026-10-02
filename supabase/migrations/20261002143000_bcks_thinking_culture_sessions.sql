-- Three distinct, balanced practice packages. Existing attempts retain level 0.
alter table public.bcks_substansi_attempts add column if not exists session_level smallint not null default 0 check(session_level between 0 and 3);
create or replace function private.bcks_thinking_level(at_time timestamptz)
returns smallint language sql immutable security invoker set search_path='' as $$
 select case when (at_time at time zone 'Asia/Jakarta')::time >= time '09:00'
 and (at_time at time zone 'Asia/Jakarta')::time < time '15:00'
 then case (at_time at time zone 'Asia/Jakarta')::date
 when date '2026-10-03' then 1 when date '2026-10-07' then 2 when date '2026-10-10' then 3 else 0 end else 0 end::smallint;
$$;
create or replace function private.bcks_thinking_questions(level_no smallint)
returns smallint[] language sql immutable security invoker set search_path='' as $$
 select case level_no when 1 then array[2,4,5,6,15,17,18,19,31,32,33,34,44,45,46,47,58,60,62,63]::smallint[] when 2 then array[8,9,11,12,14,22,23,25,27,28,35,37,38,39,41,49,51,52,54,56,64,65,67,68,69]::smallint[] when 3 then array[1,3,7,10,13,16,20,21,24,26,29,30,36,40,42,43,48,50,53,55,57,59,61,66,70]::smallint[] else array(select generate_series(1,70)::smallint) end;
$$;
revoke all on function private.bcks_thinking_level(timestamptz),private.bcks_thinking_questions(smallint) from public,anon;
grant execute on function private.bcks_thinking_level(timestamptz),private.bcks_thinking_questions(smallint) to authenticated,service_role;
create or replace function private.bcks_thinking_access()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.bcks_thinking_level(now())>0
 and coalesce((select case when c.updated_at >= (((now() at time zone 'Asia/Jakarta')::date + time '09:00') at time zone 'Asia/Jakarta')
 then c.is_open else true end from public.bcks_substansi_access_control c where singleton_key='GLOBAL'),false);
$$;
revoke all on function private.bcks_thinking_access() from public,anon;
grant execute on function private.bcks_thinking_access() to authenticated;
alter table public.bcks_substansi_attempts drop constraint bcks_substansi_attempt_shape;
alter table public.bcks_substansi_attempts add constraint bcks_substansi_attempt_shape check(
 (mode='SIMULASI' and target_competency is null and total_questions=case session_level when 0 then 70 when 1 then 20 else 25 end)
 or (mode='COACH' and target_competency in ('KEPRIBADIAN','SOSIAL','MANAJERIAL','KEWIRAUSAHAAN','SUPERVISI') and total_questions=case session_level when 0 then 10 when 1 then 4 else 5 end));
drop policy if exists bcks_attempts_insert on public.bcks_substansi_attempts;
create policy bcks_attempts_insert on public.bcks_substansi_attempts for insert to authenticated with check(
 user_id=(select auth.uid()) and session_level=private.bcks_thinking_level(now())
 and private.bcks_thinking_access()
 and expires_at <= ((now() at time zone 'Asia/Jakarta')::date + time '15:00') at time zone 'Asia/Jakarta'
 and exists(select 1 from public.ks_bcks_submission_details d where d.user_id=(select auth.uid()) and coalesce(d.is_archived,false)=false
 and d.workflow_stage in ('SUBSTANSI','DIKLAT','SERTIFIKAT') and d.admin_status in ('TERVERIFIKASI','DISETUJUI')));
create or replace function private.bcks_thinking_answer_guard()
returns trigger language plpgsql security definer set search_path='' as $$
declare a public.bcks_substansi_attempts;
begin
 if auth.uid() is null or new.user_id<>auth.uid() then raise exception 'Unauthorized'; end if;
 select * into a from public.bcks_substansi_attempts where id=new.attempt_id and user_id=auth.uid();
 if not found or a.status<>'IN_PROGRESS' or now()>a.expires_at then raise exception 'Attempt unavailable'; end if;
 if not (new.question_no=any(private.bcks_thinking_questions(a.session_level))) then raise exception 'Question outside session package'; end if;
 if a.mode='COACH' and not exists(select 1 from public.bcks_substansi_answer_keys k where k.question_no=new.question_no and k.competency=a.target_competency) then raise exception 'Question outside coach competency'; end if;
 return new;
end;
$$;
revoke all on function private.bcks_thinking_answer_guard() from public,anon,authenticated;
create trigger bcks_thinking_answer_guard before insert or update on public.bcks_substansi_answers for each row execute function private.bcks_thinking_answer_guard();
