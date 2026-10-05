create or replace function public.bcks_substansi_telemetry_summary(p_attempt_ids uuid[])
returns table(
  attempt_id uuid,
  event_count bigint,
  tab_switch_count bigint,
  blur_count bigint,
  revision_count bigint,
  unusual_pause_count bigint,
  immediate_answer_after_pause_count bigint,
  total_away_seconds bigint,
  max_away_seconds integer,
  total_question_dwell_seconds bigint
)
language sql
stable
security definer
set search_path=''
as $$
  select
    e.attempt_id,
    count(*)::bigint as event_count,
    count(*) filter (where e.event_type='VISIBILITY_HIDDEN')::bigint as tab_switch_count,
    count(*) filter (where e.event_type='WINDOW_BLUR')::bigint as blur_count,
    count(*) filter (where e.event_type='ANSWER_CHANGE' and e.revision=true)::bigint as revision_count,
    count(*) filter (
      where e.event_type='VISIBILITY_VISIBLE'
        and e.away_seconds between 30 and 180
    )::bigint as unusual_pause_count,
    count(*) filter (
      where e.event_type='ANSWER_CHANGE'
        and e.away_seconds between 30 and 180
        and e.after_return_seconds between 0 and 15
    )::bigint as immediate_answer_after_pause_count,
    coalesce(sum(e.away_seconds) filter (where e.event_type='VISIBILITY_VISIBLE'),0)::bigint as total_away_seconds,
    coalesce(max(e.away_seconds) filter (where e.event_type='VISIBILITY_VISIBLE'),0)::integer as max_away_seconds,
    coalesce(sum(e.dwell_seconds) filter (where e.event_type='QUESTION_LEAVE'),0)::bigint as total_question_dwell_seconds
  from public.bcks_substansi_telemetry_events e
  where e.attempt_id=any(p_attempt_ids)
  group by e.attempt_id;
$$;

revoke all on function public.bcks_substansi_telemetry_summary(uuid[]) from public, anon, authenticated;
grant execute on function public.bcks_substansi_telemetry_summary(uuid[]) to service_role;

comment on function public.bcks_substansi_telemetry_summary(uuid[]) is
  'Aggregates behavioral telemetry for human review. Metrics are indicators only, never automatic proof of misconduct.';
