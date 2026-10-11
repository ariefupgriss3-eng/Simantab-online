-- SIMANTAB Multi-Usulan — DRAFT STAGING ONLY (2026-10-12)
-- WARNING: Review-only schema/RPC. DO NOT execute against Supabase production.
-- Prerequisites: isolated copy of public.profiles, school_master, submissions,
-- existing triggers/private routing functions, auth.uid(), and RLS.
-- Deliberate limitation: creates DRAFT ONLY; no RPC to send/approve proposals.
-- No test accounts created or production users changed.

BEGIN;

CREATE TABLE IF NOT EXISTS public.operator_assignments (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  operator_kind text NOT NULL CHECK (operator_kind IN ('SMP','KORWIL')),
  school_npsn text REFERENCES public.school_master(npsn),
  kecamatan text,
  is_active boolean NOT NULL DEFAULT false,
  assigned_by uuid REFERENCES public.profiles(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (operator_kind='SMP' AND school_npsn IS NOT NULL AND kecamatan IS NULL)
    OR (operator_kind='KORWIL' AND school_npsn IS NULL
        AND kecamatan IS NOT NULL AND length(btrim(kecamatan))>2)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS operator_one_active_smp_per_npsn
  ON public.operator_assignments(school_npsn)
  WHERE operator_kind='SMP' AND is_active=true;

CREATE UNIQUE INDEX IF NOT EXISTS operator_one_active_korwil_per_kecamatan
  ON public.operator_assignments (lower(btrim(kecamatan)))
  WHERE operator_kind='KORWIL' AND is_active=true;

-- Purposefully stores applicant identity independently of the sending operator.
CREATE TABLE IF NOT EXISTS public.operator_submission_subjects (
  submission_id uuid PRIMARY KEY REFERENCES public.submissions(id) ON DELETE CASCADE,
  operator_user_id uuid NOT NULL REFERENCES public.profiles(id),
  client_request_key uuid NOT NULL,
  applicant_name text NOT NULL CHECK (length(btrim(applicant_name)) BETWEEN 3 AND 180),
  applicant_nip text NOT NULL CHECK (applicant_nip ~ '^[0-9]{8,20}$'),
  applicant_position text NOT NULL CHECK (applicant_position IN ('GURU','KEPALA_SEKOLAH')),
  school_npsn text NOT NULL REFERENCES public.school_master(npsn),
  service_type text NOT NULL CHECK (service_type IN ('CUTI','KGB')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_user_id,client_request_key)
);

CREATE INDEX IF NOT EXISTS operator_subjects_owner_idx
  ON public.operator_submission_subjects(operator_user_id,created_at DESC);

ALTER TABLE public.operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_submission_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operator_assignments_read ON public.operator_assignments;
CREATE POLICY operator_assignments_read ON public.operator_assignments
  FOR SELECT TO authenticated
  USING (user_id=auth.uid() OR private.is_dinas());

DROP POLICY IF EXISTS operator_subjects_read ON public.operator_submission_subjects;
CREATE POLICY operator_subjects_read ON public.operator_submission_subjects
  FOR SELECT TO authenticated
  USING (operator_user_id=auth.uid() OR private.is_dinas());

-- No client-side write to assignments/applicant identity, even using a forged payload.
REVOKE ALL ON public.operator_assignments FROM anon,authenticated;
REVOKE ALL ON public.operator_submission_subjects FROM anon,authenticated;
GRANT SELECT ON public.operator_assignments TO authenticated;
GRANT SELECT ON public.operator_submission_subjects TO authenticated;

-- Restrictive RLS ADDS to existing permissive policies; ordinary GTK/Dinas flows
-- retain their existing permissions. Operator roles MUST use the verified RPC.
DROP POLICY IF EXISTS operator_deny_direct_insert ON public.submissions;
CREATE POLICY operator_deny_direct_insert ON public.submissions
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    private.current_role() NOT IN ('OPERATOR_SMP','OPERATOR_KORWIL')
  );

DROP POLICY IF EXISTS operator_deny_direct_update ON public.submissions;
CREATE POLICY operator_deny_direct_update ON public.submissions
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (
    private.current_role() NOT IN ('OPERATOR_SMP','OPERATOR_KORWIL')
  )
  WITH CHECK (
    private.current_role() NOT IN ('OPERATOR_SMP','OPERATOR_KORWIL')
  );

DROP POLICY IF EXISTS operator_deny_direct_delete ON public.submissions;
CREATE POLICY operator_deny_direct_delete ON public.submissions
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (
    private.current_role() NOT IN ('OPERATOR_SMP','OPERATOR_KORWIL')
  );

CREATE OR REPLACE FUNCTION public.operator_create_draft(
  p_request_key uuid,
  p_npsn text,
  p_name text,
  p_nip text,
  p_position text,
  p_service_type text,
  p_title text DEFAULT NULL,
  p_description text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','private','auth','pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_profile record;
  v_assignment record;
  v_school record;
  v_scope text;
  v_existing public.operator_submission_subjects%ROWTYPE;
  v_sub_id uuid;
  v_service text := upper(btrim(coalesce(p_service_type,'')));
  v_name text := btrim(coalesce(p_name,''));
  v_nip text := btrim(coalesce(p_nip,''));
  v_npsn text := btrim(coalesce(p_npsn,''));
  v_position text := upper(btrim(coalesce(p_position,'')));
  v_title text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Login diperlukan untuk membuat draf operator.';
  END IF;

  IF p_request_key IS NULL OR v_service NOT IN ('CUTI','KGB')
     OR v_npsn !~ '^[0-9]{8}$'
     OR length(v_name) NOT BETWEEN 3 AND 180
     OR v_nip !~ '^[0-9]{8,20}$'
     OR v_position NOT IN ('GURU','KEPALA_SEKOLAH')
     OR length(coalesce(p_description,''))>4000 THEN
    RAISE EXCEPTION 'Data pemohon, sekolah, layanan, atau request_key tidak valid.';
  END IF;

  v_title := coalesce(nullif(btrim(coalesce(p_title,'')),''),v_service||' — '||v_name);
  IF length(v_title)<3 OR length(v_title)>200 THEN
    RAISE EXCEPTION 'Judul usulan harus 3–200 karakter.';
  END IF;

  SELECT p.id,p.role,p.school_npsn,p.account_channel,p.is_active,p.approval_status
  INTO v_profile
  FROM public.profiles p
  WHERE p.id=v_uid;

  IF NOT FOUND OR v_profile.is_active IS DISTINCT FROM true
     OR v_profile.approval_status IS DISTINCT FROM 'APPROVED'
     OR v_profile.account_channel IS DISTINCT FROM 'GTK'
     OR v_profile.role NOT IN ('OPERATOR_SMP','OPERATOR_KORWIL') THEN
    RAISE EXCEPTION 'Identitas operator tidak aktif atau belum disetujui.';
  END IF;

  SELECT a.user_id,a.operator_kind,a.school_npsn,a.kecamatan,a.is_active
  INTO v_assignment
  FROM public.operator_assignments a
  WHERE a.user_id=v_uid
  FOR SHARE;

  IF NOT FOUND OR v_assignment.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Penugasan operator tidak tersedia.';
  END IF;

  SELECT s.npsn,s.jenjang,s.school_status,s.kecamatan,s.is_active
  INTO v_school
  FROM public.school_master s
  WHERE s.npsn=v_npsn;

  IF NOT FOUND OR v_school.is_active IS DISTINCT FROM true
     OR upper(btrim(coalesce(v_school.school_status,'')))<>'NEGERI' THEN
    RAISE EXCEPTION 'Sekolah tidak aktif atau bukan sekolah negeri.';
  END IF;

  IF v_assignment.operator_kind='SMP'
     AND v_profile.role='OPERATOR_SMP'
     AND v_profile.school_npsn=v_npsn
     AND v_assignment.school_npsn=v_npsn
     AND upper(btrim(coalesce(v_school.jenjang,'')))='SMP' THEN
    v_scope:='SMP';
  ELSIF v_assignment.operator_kind='KORWIL'
     AND v_profile.role='OPERATOR_KORWIL'
     AND v_assignment.school_npsn IS NULL
     AND upper(btrim(coalesce(v_school.jenjang,'')))='SD'
     AND lower(btrim(coalesce(v_assignment.kecamatan,'')))=
         lower(btrim(coalesce(v_school.kecamatan,''))) THEN
    v_scope:='SD';
  ELSE
    RAISE EXCEPTION 'AKSES DITOLAK: NPSN atau kecamatan di luar penugasan.';
  END IF;

  -- Repeat requests with the same UUID return the prior draft only if
  -- submitted payload matches; do not silently accept a changed applicant.
  SELECT * INTO v_existing FROM public.operator_submission_subjects
  WHERE operator_user_id=v_uid AND client_request_key=p_request_key;
  IF FOUND THEN
    IF v_existing.school_npsn=v_npsn AND
       v_existing.applicant_name=v_name AND
       v_existing.applicant_nip=v_nip AND
       v_existing.applicant_position=v_position AND
       v_existing.service_type=v_service THEN
      RETURN v_existing.submission_id;
    END IF;
    RAISE EXCEPTION 'Request key sudah digunakan untuk data lain.';
  END IF;

  INSERT INTO public.submissions
    (user_id,service_type,title,description,status,
     scope_level,coordinator_role,assigned_role)
  VALUES
    (v_uid,v_service,v_title,coalesce(p_description,''),'DRAFT',
     v_scope,private.coordinator_for_scope(v_scope),
     private.recommended_staff_role(v_service))
  RETURNING id INTO v_sub_id;

  INSERT INTO public.operator_submission_subjects
    (submission_id,operator_user_id,client_request_key,
     applicant_name,applicant_nip,applicant_position,school_npsn,service_type)
  VALUES
    (v_sub_id,v_uid,p_request_key,
     v_name,v_nip,v_position,v_npsn,v_service);

  RETURN v_sub_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.operator_create_draft(
  uuid,text,text,text,text,text,text,text
) FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.operator_create_draft(
  uuid,text,text,text,text,text,text,text
) TO authenticated;

COMMIT;

-- Note: no operator_submit_draft RPC is intentionally provided in this phase.
-- Formal submission requires approved Cuti/KGB document requirements,
-- storage verification, and regression tests for existing Dinas workflows.
-- This SQL is NOT a production-ready migration.
