-- Prevent duplicate concurrent active BCKS simulation attempts per participant and level.
create unique index if not exists uq_bcks_one_active_attempt_per_level
on public.bcks_substansi_attempts(user_id, session_level)
where mode='SIMULASI'
  and status='IN_PROGRESS'
  and session_level in (2,3,4,30);
