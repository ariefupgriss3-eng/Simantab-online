-- ks_bcks_submit_administrasi updates status; the BEFORE routing trigger
-- changes workflow_state as a side effect. PostgreSQL's UPDATE OF trigger
-- matches the original SET list, so listen to status as well.
drop trigger if exists trg_ks_bcks_ai_assign_after_submission on public.submissions;
create trigger trg_ks_bcks_ai_assign_after_submission
after insert or update of status, workflow_state on public.submissions
for each row
when (new.service_type='DIKLAT_KS_BCKS'
      and new.status='SUBMITTED'
      and new.workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR')
execute function private.ks_bcks_ai_assign_after_submission();

-- Process submissions held by the earlier trigger definition, only when the
-- school's GTK needs have been submitted or verified.
update public.submissions s
set workflow_state=workflow_state
where s.service_type='DIKLAT_KS_BCKS'
  and s.status='SUBMITTED'
  and s.workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR'
  and exists (
    select 1 from public.profiles p
    join public.school_gtk_needs_workflow w on w.school_npsn=p.school_npsn
    where p.id=s.user_id and w.status in ('SUBMITTED','VERIFIED')
  );
