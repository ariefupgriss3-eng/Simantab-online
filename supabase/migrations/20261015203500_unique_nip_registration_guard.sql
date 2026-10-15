-- SIMANTAB Anti-Akun Ganda 2026-10-15
-- Guard registrations and new NIP claims, grandfathering all existing duplicates
-- without modifying auth users, profiles, approvals, or submissions.

CREATE OR REPLACE FUNCTION private.simantab_reject_duplicate_nip()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public,private,pg_temp
AS $$
DECLARE
  v_nip text;
  v_existing uuid;
BEGIN
  v_nip := regexp_replace(coalesce(NEW.nip,''),'[^0-9]','','g');
  IF length(v_nip)<>18 THEN
    RETURN NEW;
  END IF;
  -- Existing accounts can update unrelated profile fields even if their NIP
  -- is already duplicated from before this rule.
  IF TG_OP='UPDATE' AND
    regexp_replace(coalesce(OLD.nip,''),'[^0-9]','','g')=v_nip THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent registrations with the same NIP; a SELECT-only
  -- preflight in an Edge Function cannot prevent concurrent duplicate inserts.
  PERFORM pg_advisory_xact_lock(20261015,hashtext(v_nip));

  SELECT p.id INTO v_existing
  FROM public.profiles AS p
  WHERE p.id IS DISTINCT FROM NEW.id
    AND regexp_replace(coalesce(p.nip,''),'[^0-9]','','g')=v_nip
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE='23505',
      MESSAGE='NIP sudah terdaftar di SIMANTAB. Gunakan Login, Lupa Password, atau hubungi Super Admin.',
      CONSTRAINT='simantab_one_nip_one_account',
      DETAIL='Pendaftaran/perubahan NIP diblokir; akun yang sudah ada tidak diubah.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.simantab_reject_duplicate_nip() FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS simantab_unique_nip_registration_guard ON public.profiles;
CREATE TRIGGER simantab_unique_nip_registration_guard
BEFORE INSERT OR UPDATE OF nip ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.simantab_reject_duplicate_nip();

COMMENT ON FUNCTION private.simantab_reject_duplicate_nip() IS
'Atomic unique NIP guard for new SIMANTAB registrations and NIP changes; pre-existing duplicate profiles remain intact.';

-- Read-only Super Admin audit; no public view exposing NIP/email or account history.
CREATE OR REPLACE FUNCTION public.simantab_duplicate_nip_audit()
RETURNS TABLE (
  nip text,
  account_count bigint,
  approved_active bigint,
  pending_count bigint,
  name_variants bigint,
  accounts jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO public,private,auth,pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id=auth.uid()
      AND p.role='SUPER_ADMIN'
      AND p.is_active=true
      AND p.approval_status='APPROVED'
  ) THEN
    RAISE EXCEPTION 'Hanya Super Admin aktif dan disetujui yang dapat mengaudit NIP ganda.'
      USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH normalized AS (
    SELECT p.id,p.full_name,p.nip,p.role,p.requested_role,p.approval_status,
           p.is_active,p.account_channel,p.created_at,
           coalesce(nullif(btrim(p.unit_gtk),''),nullif(btrim(p.unit),''),'') AS unit_name,
           a.email,a.last_sign_in_at,
           regexp_replace(coalesce(p.nip,''),'[^0-9]','','g') AS normalized_nip,
           coalesce(s.submission_count,0)::bigint AS submissions_count,
           s.last_submitted
    FROM public.profiles p
    LEFT JOIN auth.users a ON a.id=p.id
    LEFT JOIN LATERAL (
      SELECT count(*) AS submission_count,max(submitted_at) AS last_submitted
      FROM public.submissions WHERE user_id=p.id
    ) s ON true
  ),
  duplicate_nip AS (
    SELECT n.normalized_nip AS key
    FROM normalized n
    WHERE length(n.normalized_nip)=18
    GROUP BY n.normalized_nip
    HAVING count(*)>1
  )
  SELECT
    n.normalized_nip,
    count(*) AS account_count,
    count(*) FILTER(WHERE n.is_active AND n.approval_status='APPROVED') AS approved_active,
    count(*) FILTER(WHERE n.approval_status='PENDING') AS pending_count,
    count(DISTINCT regexp_replace(upper(btrim(n.full_name)),'\s+',' ','g')) AS name_variants,
    jsonb_agg(
      jsonb_build_object(
        'id',n.id,
        'full_name',n.full_name,
        'email',n.email,
        'role',n.role,
        'requested_role',n.requested_role,
        'approval_status',n.approval_status,
        'is_active',n.is_active,
        'account_channel',n.account_channel,
        'unit',n.unit_name,
        'created_at',n.created_at,
        'last_sign_in_at',n.last_sign_in_at,
        'submission_count',n.submissions_count,
        'last_submitted',n.last_submitted
      )
      ORDER BY
        (n.is_active AND n.approval_status='APPROVED') DESC,
        n.submissions_count DESC,n.last_sign_in_at DESC NULLS LAST,n.created_at DESC NULLS LAST
    ) AS accounts
  FROM normalized n JOIN duplicate_nip d ON d.key=n.normalized_nip
  GROUP BY n.normalized_nip
  ORDER BY
    count(*) FILTER(WHERE n.is_active AND n.approval_status='APPROVED') DESC,
    count(*) DESC,n.normalized_nip;
END;
$$;

REVOKE ALL ON FUNCTION public.simantab_duplicate_nip_audit() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.simantab_duplicate_nip_audit() TO authenticated;
COMMENT ON FUNCTION public.simantab_duplicate_nip_audit() IS
'Super Admin only read-only duplicate NIP review, including activation, last login and number of submissions. Does not select a primary account or delete accounts.';
