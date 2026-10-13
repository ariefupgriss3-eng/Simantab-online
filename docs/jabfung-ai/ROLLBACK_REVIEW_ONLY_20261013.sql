-- REVIEW ONLY — CONDITIONAL EMERGENCY ROLLBACK (NOT APPLIED).
-- CAUTION: This restores previous, wider private.is_dinas() read scope, including
-- possible Pengawas/Korwil visibility. Prefer forward fix when possible.
-- Before executing in production: new approval, current-schema check, snapshot, QA.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
DO $guard$
DECLARE v_count integer;
BEGIN
 SELECT count(*) INTO v_count FROM pg_policies
 WHERE schemaname='public'
  AND ((tablename='jabfung_ai_verification_runs' AND policyname='jabfung_ai_runs_read')
  OR (tablename='jabfung_ai_document_verifications' AND policyname='jabfung_ai_docs_read'))
  AND qual LIKE '%jabfung_ai_can_access_submission%';
 IF v_count<>2 THEN RAISE EXCEPTION 'ABORT: unexpected Jabfung AI policies'; END IF;
 IF position('JABFUNG_AI_AUTH_SCOPE_V3_20261013' in pg_get_functiondef('public.jabfung_ai_claim_request(uuid)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'ABORT: quota RPC no longer matches patch marker';
 END IF;
 IF position('jabfung_ai_can_access_submission' in pg_get_functiondef('public.jabfung_ai_claim_request(uuid)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'ABORT: access RPC changed; inspect manually';
 END IF;
END $guard$;

ALTER POLICY jabfung_ai_runs_read ON public.jabfung_ai_verification_runs
 USING (EXISTS (SELECT 1 FROM public.submissions s
 WHERE s.id=jabfung_ai_verification_runs.submission_id
 AND (s.user_id=auth.uid() OR private.is_dinas())));
ALTER POLICY jabfung_ai_docs_read ON public.jabfung_ai_document_verifications
 USING (EXISTS (SELECT 1 FROM public.submissions s
 WHERE s.id=jabfung_ai_document_verifications.submission_id
 AND (s.user_id=auth.uid() OR private.is_dinas())));

CREATE OR REPLACE FUNCTION public.jabfung_ai_claim_request(p_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','private','auth'
AS $fn$
DECLARE
 v_uid uuid := auth.uid();
 v_owner uuid;
 v_service text;
 v_hour_count integer;
 v_day_count integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 SELECT user_id,service_type INTO v_owner,v_service
 FROM public.submissions WHERE id=p_submission_id;
 IF v_owner IS NULL OR v_service<>'E_JABFUNG' THEN
  RAISE EXCEPTION 'Usulan Jabfung tidak tersedia.';
 END IF;
 IF v_owner<>v_uid AND NOT private.is_dinas() THEN
  RAISE EXCEPTION 'Tidak berwenang.';
 END IF;
 SELECT count(*) INTO v_hour_count FROM public.jabfung_ai_gateway_requests
 WHERE user_id=v_uid AND submission_id=p_submission_id
 AND requested_at>=now()-interval '1 hour';
 IF v_hour_count>=3 THEN RETURN jsonb_build_object(
  'allowed',false,'reason','RATE_LIMIT_SUBMISSION',
  'message','Batas AI untuk usulan ini adalah 3 pemeriksaan per jam. Gunakan hasil terakhir atau coba kembali kemudian.');
 END IF;
 SELECT count(*) INTO v_day_count FROM public.jabfung_ai_gateway_requests
 WHERE user_id=v_uid AND requested_at>=now()-interval '24 hours';
 IF v_day_count>=60 THEN RETURN jsonb_build_object(
  'allowed',false,'reason','RATE_LIMIT_DAILY',
  'message','Batas penggunaan AI harian akun ini telah tercapai. Coba kembali pada periode berikutnya.');
 END IF;
 INSERT INTO public.jabfung_ai_gateway_requests(user_id,submission_id)
 VALUES(v_uid,p_submission_id);
 RETURN jsonb_build_object('allowed',true,'hour_count',v_hour_count+1,'day_count',v_day_count+1);
END;
$fn$;

DO $postflight$
BEGIN
 IF md5(pg_get_functiondef('public.jabfung_ai_claim_request(uuid)'::regprocedure)) <> '552a3e2823cd66e7f2c4696588b40556' THEN
  RAISE EXCEPTION 'ABORT: original quota function body failed to restore';
 END IF;
END $postflight$;
DROP FUNCTION private.jabfung_ai_can_access_submission(uuid);
COMMIT;
