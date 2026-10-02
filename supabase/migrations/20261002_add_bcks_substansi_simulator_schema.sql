-- SIMANTAB BCKS Seleksi Substansi simulator schema
-- Answer-key VALUES are intentionally not versioned in GitHub.
-- They are seeded through a restricted server-side/admin process only.

create table if not exists public.bcks_substansi_answer_keys(
  question_no smallint primary key check(question_no between 1 and 70),
  competency text not null check(competency in ('KEPRIBADIAN','SOSIAL','MANAJERIAL','KEWIRAUSAHAAN','SUPERVISI')),
  subcompetency text not null,
  correct_option text not null check(correct_option in ('A','B','C','D')),
  created_at timestamptz not null default now()
);
alter table public.bcks_substansi_answer_keys enable row level security;
revoke all on public.bcks_substansi_answer_keys from anon, authenticated;

drop policy if exists bcks_answer_keys_deny_authenticated on public.bcks_substansi_answer_keys;
create policy bcks_answer_keys_deny_authenticated
on public.bcks_substansi_answer_keys for select to authenticated using (false);

drop policy if exists bcks_answer_keys_deny_anon on public.bcks_substansi_answer_keys;
create policy bcks_answer_keys_deny_anon
on public.bcks_substansi_answer_keys for select to anon using (false);

create table if not exists public.bcks_substansi_attempts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check(mode in ('SIMULASI','COACH')),
  target_competency text null check(target_competency is null or target_competency in ('KEPRIBADIAN','SOSIAL','MANAJERIAL','KEWIRAUSAHAAN','SUPERVISI')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz null,
  status text not null default 'IN_PROGRESS' check(status in ('IN_PROGRESS','SUBMITTED','EXPIRED')),
  total_questions smallint not null,
  correct_count smallint null,
  score numeric(5,2) null,
  readiness_label text null,
  priority_competency text null,
  dominant_subcompetency text null,
  created_at timestamptz not null default now(),
  constraint bcks_substansi_attempt_shape check(
    (mode='SIMULASI' and total_questions=70 and target_competency is null)
    or
    (mode='COACH' and total_questions=10 and target_competency in ('KEPRIBADIAN','SOSIAL','MANAJERIAL','KEWIRAUSAHAAN','SUPERVISI'))
  ),
  constraint bcks_substansi_attempt_time check(expires_at>started_at and expires_at<=started_at+interval '125 minutes')
);

create table if not exists public.bcks_substansi_answers(
  attempt_id uuid not null references public.bcks_substansi_attempts(id) on delete cascade,
  question_no smallint not null check(question_no between 1 and 70),
  user_id uuid not null references public.profiles(id) on delete cascade,
  selected_option text null check(selected_option is null or selected_option in ('A','B','C','D')),
  is_doubtful boolean not null default false,
  seconds_spent integer not null default 0 check(seconds_spent between 0 and 7200),
  answered_at timestamptz not null default now(),
  primary key(attempt_id,question_no)
);

create table if not exists public.bcks_substansi_competency_scores(
  attempt_id uuid not null references public.bcks_substansi_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  competency text not null check(competency in ('KEPRIBADIAN','SOSIAL','MANAJERIAL','KEWIRAUSAHAAN','SUPERVISI')),
  correct_count smallint not null default 0,
  total_count smallint not null default 0,
  percentage numeric(5,2) not null default 0,
  primary key(attempt_id,competency)
);

create index if not exists bcks_substansi_attempts_user_started_idx on public.bcks_substansi_attempts(user_id,started_at desc);
create index if not exists bcks_substansi_attempts_status_idx on public.bcks_substansi_attempts(status,mode,started_at desc);
create index if not exists bcks_substansi_answers_user_attempt_idx on public.bcks_substansi_answers(user_id,attempt_id);
create index if not exists bcks_substansi_scores_user_idx on public.bcks_substansi_competency_scores(user_id,attempt_id);

alter table public.bcks_substansi_attempts enable row level security;
alter table public.bcks_substansi_answers enable row level security;
alter table public.bcks_substansi_competency_scores enable row level security;

drop policy if exists bcks_attempts_select on public.bcks_substansi_attempts;
create policy bcks_attempts_select on public.bcks_substansi_attempts for select to authenticated
using(
 user_id=(select auth.uid())
 or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active=true and p.account_channel='DINAS')
);

drop policy if exists bcks_attempts_insert on public.bcks_substansi_attempts;
create policy bcks_attempts_insert on public.bcks_substansi_attempts for insert to authenticated
with check(
 user_id=(select auth.uid())
 and exists(
   select 1 from public.ks_bcks_submission_details d
   where d.user_id=(select auth.uid())
     and coalesce(d.is_archived,false)=false
     and d.workflow_stage in ('SUBSTANSI','DIKLAT','SERTIFIKAT')
     and d.admin_status in ('TERVERIFIKASI','DISETUJUI')
 )
);

drop policy if exists bcks_answers_select on public.bcks_substansi_answers;
create policy bcks_answers_select on public.bcks_substansi_answers for select to authenticated
using(
 user_id=(select auth.uid())
 or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active=true and p.account_channel='DINAS')
);

drop policy if exists bcks_answers_insert on public.bcks_substansi_answers;
create policy bcks_answers_insert on public.bcks_substansi_answers for insert to authenticated
with check(
 user_id=(select auth.uid())
 and exists(
   select 1 from public.bcks_substansi_attempts a
   where a.id=bcks_substansi_answers.attempt_id
     and a.user_id=(select auth.uid())
     and a.status='IN_PROGRESS'
     and now()<=a.expires_at
 )
);

drop policy if exists bcks_answers_update on public.bcks_substansi_answers;
create policy bcks_answers_update on public.bcks_substansi_answers for update to authenticated
using(
 user_id=(select auth.uid())
 and exists(
   select 1 from public.bcks_substansi_attempts a
   where a.id=bcks_substansi_answers.attempt_id
     and a.user_id=(select auth.uid())
     and a.status='IN_PROGRESS'
     and now()<=a.expires_at
 )
)
with check(
 user_id=(select auth.uid())
 and exists(
   select 1 from public.bcks_substansi_attempts a
   where a.id=bcks_substansi_answers.attempt_id
     and a.user_id=(select auth.uid())
     and a.status='IN_PROGRESS'
     and now()<=a.expires_at
 )
);

drop policy if exists bcks_scores_select on public.bcks_substansi_competency_scores;
create policy bcks_scores_select on public.bcks_substansi_competency_scores for select to authenticated
using(
 user_id=(select auth.uid())
 or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active=true and p.account_channel='DINAS')
);

revoke all on public.bcks_substansi_attempts from anon, authenticated;
revoke all on public.bcks_substansi_answers from anon, authenticated;
revoke all on public.bcks_substansi_competency_scores from anon, authenticated;

grant select on public.bcks_substansi_attempts to authenticated;
grant insert(user_id,mode,target_competency,expires_at,total_questions) on public.bcks_substansi_attempts to authenticated;

grant select on public.bcks_substansi_answers to authenticated;
grant insert(attempt_id,question_no,user_id,selected_option,is_doubtful,seconds_spent,answered_at) on public.bcks_substansi_answers to authenticated;
grant update(selected_option,is_doubtful,seconds_spent,answered_at) on public.bcks_substansi_answers to authenticated;

grant select on public.bcks_substansi_competency_scores to authenticated;
