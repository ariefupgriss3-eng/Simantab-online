-- BCKS readiness viewer scope by education level.
-- Kabid / Kadin / Sekdin / Super Admin: all levels.
-- Kasi SD: SD only. Kasi SMP: SMP only. Subkoor TK: PAUD/TK only.
-- Participants always retain access to their own readiness rows.

create or replace function public.bcks_can_view_readiness(target_user_id uuid)
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

revoke all on function public.bcks_can_view_readiness(uuid) from public, anon;
grant execute on function public.bcks_can_view_readiness(uuid) to authenticated;

drop policy if exists bcks_attempts_select on public.bcks_substansi_attempts;
create policy bcks_attempts_select
on public.bcks_substansi_attempts
for select to authenticated
using (public.bcks_can_view_readiness(user_id));

drop policy if exists bcks_answers_select on public.bcks_substansi_answers;
create policy bcks_answers_select
on public.bcks_substansi_answers
for select to authenticated
using (public.bcks_can_view_readiness(user_id));

drop policy if exists bcks_scores_select on public.bcks_substansi_competency_scores;
create policy bcks_scores_select
on public.bcks_substansi_competency_scores
for select to authenticated
using (public.bcks_can_view_readiness(user_id));
