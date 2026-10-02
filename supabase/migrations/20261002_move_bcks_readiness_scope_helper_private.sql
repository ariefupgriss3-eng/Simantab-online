-- Move BCKS readiness scope helper out of exposed public API schema.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.bcks_can_view_readiness(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    target_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles viewer
      where viewer.id = auth.uid()
        and viewer.is_active = true
        and viewer.account_channel = 'DINAS'
        and (
          viewer.role in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID')
          or (
            viewer.role = 'KASI_SD'
            and exists (
              select 1
              from public.profiles target
              join public.school_master sm on sm.npsn = target.school_npsn
              where target.id = target_user_id
                and upper(coalesce(sm.jenjang,'')) = 'SD'
            )
          )
          or (
            viewer.role = 'KASI_SMP'
            and exists (
              select 1
              from public.profiles target
              join public.school_master sm on sm.npsn = target.school_npsn
              where target.id = target_user_id
                and upper(coalesce(sm.jenjang,'')) = 'SMP'
            )
          )
          or (
            viewer.role = 'SUBKOOR_TK'
            and exists (
              select 1
              from public.profiles target
              join public.school_master sm on sm.npsn = target.school_npsn
              where target.id = target_user_id
                and upper(coalesce(sm.jenjang,'')) in ('PAUD','TK')
            )
          )
        )
    );
$$;

revoke all on function private.bcks_can_view_readiness(uuid) from public, anon;
grant execute on function private.bcks_can_view_readiness(uuid) to authenticated;

drop policy if exists bcks_attempts_select on public.bcks_substansi_attempts;
create policy bcks_attempts_select
on public.bcks_substansi_attempts
for select to authenticated
using (private.bcks_can_view_readiness(user_id));

drop policy if exists bcks_answers_select on public.bcks_substansi_answers;
create policy bcks_answers_select
on public.bcks_substansi_answers
for select to authenticated
using (private.bcks_can_view_readiness(user_id));

drop policy if exists bcks_scores_select on public.bcks_substansi_competency_scores;
create policy bcks_scores_select
on public.bcks_substansi_competency_scores
for select to authenticated
using (private.bcks_can_view_readiness(user_id));

drop function if exists public.bcks_can_view_readiness(uuid);
