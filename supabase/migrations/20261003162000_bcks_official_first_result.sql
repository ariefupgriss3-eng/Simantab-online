-- Mark only the first completed scheduled simulation per participant/level as the official result.
alter table public.bcks_substansi_attempts
  add column if not exists is_official_result boolean not null default false,
  add column if not exists official_exclusion_reason text,
  add column if not exists officialized_at timestamptz;

with ranked as (
  select id,
         row_number() over (
           partition by user_id, session_level
           order by submitted_at asc nulls last, started_at asc, created_at asc, id asc
         ) as rn
  from public.bcks_substansi_attempts
  where mode='SIMULASI'
    and coalesce(is_test,false)=false
    and status='SUBMITTED'
    and session_level between 1 and 3
)
update public.bcks_substansi_attempts a
set is_official_result = (r.rn=1),
    official_exclusion_reason = case
      when r.rn=1 then null
      else 'HISTORICAL_REPEAT_SUBMISSION_NOT_COUNTED'
    end,
    officialized_at = case
      when r.rn=1 then coalesce(a.officialized_at,a.submitted_at,a.started_at,now())
      else null
    end
from ranked r
where a.id=r.id;

update public.bcks_substansi_attempts
set is_official_result=false,
    officialized_at=null
where not (
  mode='SIMULASI'
  and coalesce(is_test,false)=false
  and status='SUBMITTED'
  and session_level between 1 and 3
);

create unique index if not exists uq_bcks_one_official_result_per_level
on public.bcks_substansi_attempts(user_id,session_level)
where mode='SIMULASI'
  and coalesce(is_test,false)=false
  and status='SUBMITTED'
  and is_official_result=true;

create or replace function private.bcks_assign_official_result()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.mode='SIMULASI'
     and coalesce(new.is_test,false)=false
     and new.session_level between 1 and 3
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
    if new.mode<>'SIMULASI' or coalesce(new.is_test,false)=true then
      new.officialized_at:=null;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.bcks_assign_official_result() from public, anon, authenticated;

drop trigger if exists zz_bcks_assign_official_result on public.bcks_substansi_attempts;
create trigger zz_bcks_assign_official_result
before insert or update of status,mode,session_level,is_test
on public.bcks_substansi_attempts
for each row
execute function private.bcks_assign_official_result();
