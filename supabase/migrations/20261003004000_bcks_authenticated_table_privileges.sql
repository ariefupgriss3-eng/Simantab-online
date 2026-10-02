-- Client operations remain constrained by existing ownership and schedule RLS.
grant select,insert on public.bcks_substansi_attempts to authenticated;
grant select,insert,update on public.bcks_substansi_answers to authenticated;
grant select on public.bcks_substansi_competency_scores to authenticated;
