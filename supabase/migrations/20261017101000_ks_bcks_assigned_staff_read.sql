-- 17 Oct 2026 / Diklat KS Pilihan A: assigned staff read only own tasked files.
-- Explicit role + active approved + actual assignment. No widening for other staff.
DROP POLICY IF EXISTS ks_bcks_details_assigned_staff_read ON public.ks_bcks_submission_details;
CREATE POLICY ks_bcks_details_assigned_staff_read ON public.ks_bcks_submission_details
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.profiles p ON p.id=(SELECT auth.uid())
    WHERE s.id=ks_bcks_submission_details.submission_id
    AND s.service_type='DIKLAT_KS_BCKS'
    AND p.is_active=true AND p.approval_status='APPROVED'
    AND (p.role LIKE 'STAFF_%' OR p.role LIKE 'ADMIN_%')
    AND (s.assigned_user_id=p.id OR EXISTS (
      SELECT 1 FROM public.submission_assignees a
      WHERE a.submission_id=s.id AND a.user_id=p.id
    ))
  )
);
