-- Read-only actor self-check; does not change existing RLS or submission data.
CREATE OR REPLACE FUNCTION public.simantab_submission_preflight(p_client_profile_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_active boolean;
  v_approved text;
BEGIN
  IF v_actor IS NULL THEN RETURN 'NO_SESSION'; END IF;
  IF p_client_profile_id IS NOT NULL AND p_client_profile_id IS DISTINCT FROM v_actor
  THEN RETURN 'PROFILE_MISMATCH'; END IF;
  SELECT p.is_active,p.approval_status INTO v_active,v_approved
    FROM public.profiles p WHERE p.id=v_actor;
  IF NOT FOUND THEN RETURN 'PROFILE_NOT_FOUND'; END IF;
  IF v_active IS DISTINCT FROM true THEN RETURN 'INACTIVE'; END IF;
  IF v_approved IS DISTINCT FROM 'APPROVED' THEN RETURN 'NOT_APPROVED'; END IF;
  IF private.actor_is_institution_operator() THEN RETURN 'OPERATOR_RESTRICTED'; END IF;
  RETURN 'OK';
END
$$;
REVOKE ALL ON FUNCTION public.simantab_submission_preflight(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.simantab_submission_preflight(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.simantab_submission_preflight(uuid) TO authenticated;
