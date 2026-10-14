-- Memulihkan SELECT pada INSERT ... RETURNING untuk pemilik usulan.
-- Kebijakan lama memakai SECURITY DEFINER yang mencari row pada tabel
-- submissions; row baru dapat tidak terlihat oleh snapshot SELECT fungsi.
-- Restrictive gates sim_account_approved_gate dan
-- operator_submissions_no_direct_access tetap berlaku untuk semua policy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='submissions'
      AND policyname='submissions_owner_read_returning'
  ) THEN
    CREATE POLICY submissions_owner_read_returning
      ON public.submissions
      AS PERMISSIVE
      FOR SELECT
      TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;
END;
$$;

COMMENT ON POLICY submissions_owner_read_returning ON public.submissions IS
  'Owner-only SELECT, including INSERT RETURNING; restrictive account approval and operator policies remain enforced.';
