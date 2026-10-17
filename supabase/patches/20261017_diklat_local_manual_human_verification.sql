-- SIMANTAB Diklat KS 2026-10-17. Local-only file precheck + human staff validation.
-- Already applied to Supabase production; versioned for recovery. No existing records changed.
CREATE OR REPLACE FUNCTION public.ks_bcks_submit_local(p_submission_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid:=auth.uid();
  v_allow jsonb;
  v_owner uuid;
  v_coord text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Silakan login kembali.'; END IF;
  v_allow:=public.ks_bcks_access_status();
  IF NOT coalesce((v_allow->>'is_allowed')::boolean,false)
    THEN RAISE EXCEPTION 'Akses peserta Diklat KS sedang ditutup atau dinonaktifkan.'; END IF;
  SELECT user_id,coordinator_role INTO v_owner,v_coord FROM public.submissions
    WHERE id=p_submission_id AND service_type='DIKLAT_KS_BCKS' FOR UPDATE;
  IF v_owner IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'Usulan Diklat bukan milik akun ini.'; END IF;
  IF v_coord IS NULL OR v_coord NOT IN ('KASI_SD','KASI_SMP','SUBKOOR_TK') THEN
    RAISE EXCEPTION 'Penanggung jawab Kasi/Subkoor belum ditetapkan.'; END IF;
  -- Existing owner/7-file/500 KB/SKP-year safety checks stay authoritative.
  PERFORM public.ks_bcks_submit_administrasi(p_submission_id);
  UPDATE public.submissions
    SET workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR',
        status='SUBMITTED',updated_at=now()
    WHERE id=p_submission_id;
  INSERT INTO public.notifications(role,title,message,link)
  VALUES(v_coord,'Usulan Diklat KS menunggu pembagian tugas',
         'Seleksi Administrasi diajukan dengan pemeriksaan berkas manual tanpa AI eksternal.','#monitoring');
  INSERT INTO public.submission_events(submission_id,status,note,actor_id)
  VALUES(p_submission_id,'DIKLAT_KS_MANUAL_REVIEW_QUEUE',
         'Precheck kelengkapan dan metadata selesai; menunggu Kasi/Subkoor membagi tugas pemeriksa manusia.',v_uid);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ks_bcks_review_administrasi_local(p_submission_id uuid, p_approve boolean, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth', 'pg_temp'
AS $function$
DECLARE
 v_uid uuid:=auth.uid();
 v_role text:=private.current_role();
 v_sub public.submissions%rowtype;
 v_allowed boolean;
 v_note text:=nullif(trim(coalesce(p_note,'')),'');
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Harap login.'; END IF;
 SELECT * INTO v_sub FROM public.submissions WHERE id=p_submission_id FOR UPDATE;
 IF v_sub.id IS NULL OR v_sub.service_type<>'DIKLAT_KS_BCKS'
   THEN RAISE EXCEPTION 'Usulan Diklat tidak ditemukan.'; END IF;
 IF v_sub.workflow_state<>'VERIFIKASI_STAF'
   THEN RAISE EXCEPTION 'Usulan belum berada pada tahap pemeriksaan staf.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles
       WHERE id=v_uid AND is_active=true AND approval_status='APPROVED')
   THEN RAISE EXCEPTION 'Akun verifikator belum disetujui/aktif.'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.submission_assignees
              WHERE submission_id=p_submission_id AND user_id=v_uid) INTO v_allowed;
 IF v_role IS NULL OR
    (v_role NOT IN ('SUPER_ADMIN','KABID')
     AND ((v_role NOT LIKE 'STAFF_%' AND v_role NOT LIKE 'ADMIN_%')
          OR NOT(coalesce(v_allowed,false) OR v_sub.assigned_user_id=v_uid)))
   THEN RAISE EXCEPTION 'Hanya petugas Dinas yang ditugaskan dapat memverifikasi.'; END IF;
 IF p_approve IS NULL THEN RAISE EXCEPTION 'Pilihan pemeriksaan wajib diberikan.'; END IF;
 IF NOT p_approve AND v_note IS NULL THEN
   RAISE EXCEPTION 'Alasan perbaikan wajib diisi.';
 END IF;
 IF p_approve THEN
   UPDATE public.submissions
     SET staff_verified_by=v_uid,staff_verified_at=now(),
         staff_verification_note=v_note,
         workflow_state='MENUNGGU_APPROVAL_KOORDINATOR',
         status='VERIFYING',updated_at=now() WHERE id=p_submission_id;
   UPDATE public.ks_bcks_submission_details
     SET admin_status='TERVERIFIKASI',admin_reviewed_by=v_uid,admin_reviewed_at=now(),
         admin_note=v_note,updated_at=now() WHERE submission_id=p_submission_id;
   INSERT INTO public.notifications(role,title,message,link)
      VALUES(v_sub.coordinator_role,'Verifikasi manual Diklat KS selesai',
             'Staf telah menelaah berkas Diklat KS. Menunggu persetujuan Kasi/Subkoor.','#monitoring');
 ELSE
   UPDATE public.submissions
     SET staff_verified_by=v_uid,staff_verified_at=now(),
         staff_verification_note=v_note,
         workflow_state='PERBAIKAN',status='REVISION',updated_at=now()
     WHERE id=p_submission_id;
   UPDATE public.ks_bcks_submission_details
     SET admin_status='DITOLAK',admin_reviewed_by=v_uid,admin_reviewed_at=now(),
         admin_note=v_note,workflow_stage='ADMINISTRASI',updated_at=now()
     WHERE submission_id=p_submission_id;
   INSERT INTO public.notifications(user_id,title,message,link)
     VALUES(v_sub.user_id,'Perbaiki berkas administrasi Diklat KS',v_note,'#diklatKsBcks');
 END IF;
 UPDATE public.submission_assignees
   SET verified_at=CASE WHEN user_id=v_uid THEN now() ELSE verified_at END,
       verification_result=CASE WHEN user_id=v_uid THEN
          (CASE WHEN p_approve THEN 'APPROVED' ELSE 'REVISION' END)
          ELSE verification_result END
   WHERE submission_id=p_submission_id;
 INSERT INTO public.submission_events(submission_id,status,note,actor_id)
 VALUES(p_submission_id,
        CASE WHEN p_approve THEN 'DIKLAT_KS_MANUAL_TERVERIFIKASI' ELSE 'DIKLAT_KS_MANUAL_PERBAIKAN' END,
        coalesce(v_note,CASE WHEN p_approve THEN 'Berkas ditelaah dan diverifikasi manual.' ELSE 'Perlu perbaikan.' END),
        v_uid);
END;
$function$
;

REVOKE ALL ON FUNCTION public.ks_bcks_submit_local(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.ks_bcks_review_administrasi_local(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_submit_local(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ks_bcks_review_administrasi_local(uuid,boolean,text) TO authenticated;

-- Compatibility: existing Monitoring menus still use submission_staff_verify.
-- Route ONLY the DIKLAT_KS_BCKS branch to human review, preserving other services.
DO $migration$
DECLARE ddl text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO ddl FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='submission_staff_verify';
 IF ddl IS NULL THEN RAISE EXCEPTION 'submission_staff_verify not found'; END IF;
 IF position('perform public.ks_bcks_review_administrasi_local' IN ddl)>0 THEN RETURN; END IF;
 IF position('raise exception ''Verifikasi Administrasi Diklat KS/BCKS dilakukan otomatis oleh AI Verifikator. Admin/staf hanya sebagai penanggung jawab monitoring.'';' IN ddl)=0
   THEN RAISE EXCEPTION 'Unexpected Diklat route. Review original workflow first.'; END IF;
 ddl:=replace(ddl,
   'raise exception ''Verifikasi Administrasi Diklat KS/BCKS dilakukan otomatis oleh AI Verifikator. Admin/staf hanya sebagai penanggung jawab monitoring.'';',
   'perform public.ks_bcks_review_administrasi_local(p_submission_id,p_approve,p_note); return;');
 EXECUTE ddl;
END;
$migration$;
