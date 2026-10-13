-- REVIEW ONLY: do NOT run this SQL from PR or CI.
-- SIMANTAB Jabfung AI role and RLS hardening proposal dated 13 Oct 2026.
-- Applying to production requires separate explicit user authorization after full QA.
-- Do not touch the six existing Jabfung submissions, runs, or documents.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';

DO $preflight$
DECLARE v_old int; v_new int;
BEGIN
  IF md5(pg_get_functiondef('public.jabfung_ai_claim_request(uuid)'::regprocedure)) <> '552a3e2823cd66e7f2c4696588b40556' THEN
    RAISE EXCEPTION 'ABORT: old Jabfung AI quota RPC definition changed';
  END IF;
  IF to_regprocedure('private.is_central_dinas()') IS NULL THEN
    RAISE EXCEPTION 'ABORT: missing private.is_central_dinas()';
  END IF;
  IF to_regprocedure('private.jabfung_ai_can_access_submission(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'ABORT: access function already exists; inspect drift';
  END IF;
  SELECT count(*) INTO v_old FROM pg_policies
   WHERE schemaname='public'
     AND ((tablename='jabfung_ai_verification_runs' AND policyname='jabfung_ai_runs_read')
       OR (tablename='jabfung_ai_document_verifications' AND policyname='jabfung_ai_docs_read'))
     AND cmd='SELECT' AND qual LIKE '%private.is_dinas()%';
  IF v_old<>2 THEN RAISE EXCEPTION 'ABORT: old Jabfung AI read policies differ; found %',v_old; END IF;
  SELECT count(*) INTO v_new
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN
  ('jabfung_ai_document_verifications','jabfung_ai_verification_runs') AND c.relrowsecurity;
  IF v_new<>2 THEN RAISE EXCEPTION 'ABORT: RLS must be enabled on both tables'; END IF;
END $preflight$;

-- SECURITY DEFINER authorization helper is bound to auth.uid() and to the exact case.
CREATE FUNCTION private.jabfung_ai_can_access_submission(p_submission_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path='public','private','auth'
AS $fn$
DECLARE
 v_uid uuid:=auth.uid();
 v_owner uuid;
 v_coordinator text;
 v_assignee uuid;
 v_role text;
 v_channel text;
 v_active boolean;
BEGIN
 IF v_uid IS NULL OR p_submission_id IS NULL THEN RETURN false; END IF;
 SELECT s.user_id,s.coordinator_role,s.assigned_user_id
   INTO v_owner,v_coordinator,v_assignee
 FROM public.submissions s
 WHERE s.id=p_submission_id AND s.service_type='E_JABFUNG';
 IF v_owner IS NULL THEN RETURN false; END IF;
 SELECT p.role,p.account_channel,p.is_active
   INTO v_role,v_channel,v_active
 FROM public.profiles p WHERE p.id=v_uid;
 IF v_active IS DISTINCT FROM true THEN RETURN false; END IF;
 IF v_owner=v_uid THEN RETURN true; END IF;
 IF v_channel IS DISTINCT FROM 'DINAS' THEN RETURN false; END IF;
 IF v_role IN ('SUPER_ADMIN','KABID','KEPALA_DINAS','SEKRETARIS_DINAS') THEN RETURN true; END IF;
 IF v_role=v_coordinator AND v_role IN ('KASI_SD','KASI_SMP','SUBKOOR_TK') THEN RETURN true; END IF;
 IF left(v_role,6) NOT IN ('STAFF_','ADMIN_') THEN RETURN false; END IF;
 IF NOT EXISTS (
   SELECT 1 FROM public.team_task_assignments t
   WHERE t.user_id=v_uid AND t.capability='E_JABFUNG' AND t.is_active=true
 ) THEN RETURN false; END IF;
 RETURN v_assignee=v_uid OR EXISTS (
   SELECT 1 FROM public.submission_assignees a
   WHERE a.submission_id=p_submission_id AND a.user_id=v_uid
 );
END;
$fn$;

REVOKE ALL ON FUNCTION private.jabfung_ai_can_access_submission(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.jabfung_ai_can_access_submission(uuid) TO authenticated;

ALTER POLICY jabfung_ai_runs_read ON public.jabfung_ai_verification_runs
 USING (private.jabfung_ai_can_access_submission(submission_id));
ALTER POLICY jabfung_ai_docs_read ON public.jabfung_ai_document_verifications
 USING (private.jabfung_ai_can_access_submission(submission_id));

-- Existing rate limits remain unchanged: 3 per submission/hour; 60 per user/24h.
CREATE OR REPLACE FUNCTION public.jabfung_ai_claim_request(p_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','private','auth'
AS $fn$
-- JABFUNG_AI_AUTH_SCOPE_V3_20261013
DECLARE
 v_uid uuid := auth.uid();
 v_hour_count integer;
 v_day_count integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF NOT private.jabfung_ai_can_access_submission(p_submission_id) THEN
   RAISE EXCEPTION 'Tidak berwenang untuk menggunakan AI Jabfung pada usulan ini.';
 END IF;
 SELECT count(*) INTO v_hour_count
 FROM public.jabfung_ai_gateway_requests
 WHERE user_id=v_uid AND submission_id=p_submission_id
   AND requested_at >= now() - interval '1 hour';
 IF v_hour_count>=3 THEN
   RETURN jsonb_build_object('allowed',false,'reason','RATE_LIMIT_SUBMISSION',
     'message','Batas AI untuk usulan ini adalah 3 pemeriksaan per jam. Gunakan hasil terakhir atau coba kembali kemudian.');
 END IF;
 SELECT count(*) INTO v_day_count
 FROM public.jabfung_ai_gateway_requests
 WHERE user_id=v_uid AND requested_at >= now() - interval '24 hours';
 IF v_day_count>=60 THEN
   RETURN jsonb_build_object('allowed',false,'reason','RATE_LIMIT_DAILY',
     'message','Batas penggunaan AI harian akun ini telah tercapai. Coba kembali pada periode berikutnya.');
 END IF;
 INSERT INTO public.jabfung_ai_gateway_requests(user_id,submission_id)
 VALUES(v_uid,p_submission_id);
 RETURN jsonb_build_object('allowed',true,'hour_count',v_hour_count+1,'day_count',v_day_count+1);
END;
$fn$;

DO $postflight$
DECLARE v_policies int;
BEGIN
 SELECT count(*) INTO v_policies FROM pg_policies
 WHERE schemaname='public'
   AND ((tablename='jabfung_ai_verification_runs' AND policyname='jabfung_ai_runs_read')
   OR (tablename='jabfung_ai_document_verifications' AND policyname='jabfung_ai_docs_read'))
   AND qual LIKE '%jabfung_ai_can_access_submission%';
 IF v_policies<>2 THEN RAISE EXCEPTION 'ABORT: new AI read policies missing'; END IF;
 IF position('jabfung_ai_can_access_submission' in pg_get_functiondef('public.jabfung_ai_claim_request(uuid)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'ABORT: quota RPC does not enforce access';
 END IF;
END $postflight$;
COMMIT;
