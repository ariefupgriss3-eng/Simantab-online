-- Persist a participant-specific randomized question order on each simulation attempt.
-- The randomized array is stored in package_questions so refresh, re-login, and device changes
-- do not reshuffle the same attempt. Membership is unchanged; only order differs.

create or replace function private.bcks_stamp_package()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='INSERT' then
    if new.mode='SIMULASI' then
      select pg_catalog.array_agg(x order by pg_catalog.md5(new.id::text || ':' || x::text))
        into new.package_questions
      from pg_catalog.unnest(private.bcks_thinking_questions(new.session_level)) as u(x);
    else
      new.package_questions:=private.bcks_thinking_questions(new.session_level);
    end if;
  else
    new.package_questions:=old.package_questions;
  end if;
  return new;
end;
$$;
