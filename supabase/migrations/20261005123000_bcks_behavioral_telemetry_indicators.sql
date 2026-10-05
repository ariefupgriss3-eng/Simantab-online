-- BCKS telemetry: behavioral indicators only; never an automatic misconduct verdict.
create table if not exists public.bcks_substansi_telemetry_events(
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.bcks_substansi_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_no smallint null check(question_no is null or question_no between 1 and 3000),
  display_no smallint null check(display_no is null or display_no between 1 and 70),
  event_type text not null check(event_type in (
    'SESSION_START','QUESTION_ENTER','QUESTION_LEAVE','ANSWER_CHANGE',
    'VISIBILITY_HIDDEN','VISIBILITY_VISIBLE','WINDOW_BLUR','WINDOW_FOCUS','SESSION_SUBMIT'
  )),
  client_ts timestamptz null,
  away_seconds integer null check(away_seconds is null or away_seconds between 0 and 7200),
  dwell_seconds integer null check(dwell_seconds is null or dwell_seconds between 0 and 7200),
  revision boolean not null default false,
  after_return_seconds integer null check(after_return_seconds is null or after_return_seconds between 0 and 7200),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bcks_telemetry_attempt_created_idx
  on public.bcks_substansi_telemetry_events(attempt_id,created_at);
create index if not exists bcks_telemetry_user_attempt_idx
  on public.bcks_substansi_telemetry_events(user_id,attempt_id);
create index if not exists bcks_telemetry_event_type_idx
  on public.bcks_substansi_telemetry_events(event_type,created_at);

alter table public.bcks_substansi_telemetry_events enable row level security;

revoke all on public.bcks_substansi_telemetry_events from anon, authenticated;
grant insert(
  attempt_id,user_id,question_no,display_no,event_type,client_ts,
  away_seconds,dwell_seconds,revision,after_return_seconds,metadata
) on public.bcks_substansi_telemetry_events to authenticated;

drop policy if exists bcks_telemetry_insert_own_active_attempt
  on public.bcks_substansi_telemetry_events;
create policy bcks_telemetry_insert_own_active_attempt
on public.bcks_substansi_telemetry_events
for insert to authenticated
with check(
  user_id=(select auth.uid())
  and exists(
    select 1
    from public.bcks_substansi_attempts a
    where a.id=bcks_substansi_telemetry_events.attempt_id
      and a.user_id=(select auth.uid())
      and a.mode='SIMULASI'
      and a.session_level in (2,3,4,30)
      and a.status='IN_PROGRESS'
      and now() <= a.expires_at + interval '5 minutes'
  )
);

comment on table public.bcks_substansi_telemetry_events is
  'Behavioral telemetry for BCKS scheduled simulations. Indicators support human review only and must not be treated as automatic proof of misconduct.';
