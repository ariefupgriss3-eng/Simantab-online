-- SIMANTAB DIKLAT KS PILIHAN A / 17 OCT 2026
-- Disable only Diklat-specific automatic AI triggers; completed submissions unchanged.
ALTER TABLE public.submissions DISABLE TRIGGER trg_ks_bcks_ai_assign_after_submission;
ALTER TABLE public.submissions DISABLE TRIGGER trg_ks_bcks_ai_verify_after_assignment;
ALTER TABLE public.submissions DISABLE TRIGGER trg_ks_bcks_ai_kabid_approve;

CREATE OR REPLACE FUNCTION public.ks_bcks_review_administrasi(p_submission_id uuid, p_approve boolean, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth', 'pg_temp'
AS $function$
DECLARE
 v_uid uuid := auth.uid();
 v_sub public.submissions%rowtype;
 v_role text;
 v_approved boolean;
 v_count integer;
 v_note text := nullif(trim(coalesce(p_note,'')),'');
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Harus login sebagai verifikator.'; END IF;
 SELECT role,is_active=true AND approval_status='APPROVED'
 INTO v_role,v_approved FROM public.profiles WHERE id=v_uid;
 IF v_approved IS DISTINCT FROM true THEN RAISE EXCEPTION 'Akun verifikator tidak aktif atau belum disetujui.'; END IF;
 SELECT * INTO v_sub FROM public.submissions WHERE id=p_submission_id FOR UPDATE;
 IF v_sub.id IS NULL OR v_sub.service_type<>'DIKLAT_KS_BCKS' THEN
   RAISE EXCEPTION 'Usulan Diklat KS tidak ditemukan.';
 END IF;
 IF v_sub.workflow_state<>'VERIFIKASI_STAF' THEN
   RAISE EXCEPTION 'Usulan tidak berada pada tahap verifikasi staf.';
 END IF;
 IF v_role<>'SUPER_ADMIN' AND (
     v_role NOT LIKE 'STAFF_%' AND v_role NOT LIKE 'ADMIN_%'
     OR (
       v_sub.assigned_user_id IS DISTINCT FROM v_uid
       AND NOT EXISTS (SELECT 1 FROM public.submission_assignees a
         WHERE a.submission_id=p_submission_id AND a.user_id=v_uid)
     )
 ) THEN
   RAISE EXCEPTION 'Hanya staf/admin yang ditugaskan dapat memverifikasi.';
 END IF;
 SELECT COUNT(DISTINCT requirement_code) INTO v_count FROM public.submission_files
 WHERE submission_id=p_submission_id AND file_size BETWEEN 1 AND 512000
   AND mime_type IN ('application/pdf','image/jpeg','image/png')
   AND requirement_code=ANY(ARRAY[
     'SKP_1','SKP_2','SK_PENGALAMAN_MANAJERIAL','SK_HUDIS','SKCK',
     'PAKTA_INTEGRITAS','SURAT_PERNYATAAN_DIKLAT'
   ]);
 IF v_count<>7 THEN
   RAISE EXCEPTION 'Ketujuh berkas wajib harus tersedia, berformat PDF/JPG/PNG dan maksimal 500 KB.';
 END IF;
 IF NOT p_approve AND v_note IS NULL THEN
   RAISE EXCEPTION 'Alasan pengembalian dokumen wajib diisi.';
 END IF;
 UPDATE public.submission_assignees SET
   verified_at=CASE WHEN user_id=v_uid THEN now() ELSE verified_at END,
   verification_result=CASE WHEN user_id=v_uid THEN
        (CASE WHEN p_approve THEN 'APPROVED' ELSE 'REVISION' END)
     ELSE verification_result END
 WHERE submission_id=p_submission_id;
 IF p_approve THEN
   UPDATE public.submissions SET
     staff_verified_by=v_uid, staff_verified_at=now(),
     staff_verification_note=coalesce(v_note,'Verifikasi manual oleh petugas Dinas.'),
     workflow_state='MENUNGGU_APPROVAL_KOORDINATOR',status='VERIFYING',updated_at=now()
   WHERE id=p_submission_id;
   UPDATE public.ks_bcks_submission_details SET
     admin_status='TERVERIFIKASI',admin_note=coalesce(v_note,'Diverifikasi manual.'),
     admin_reviewed_by=v_uid,admin_reviewed_at=now(),updated_at=now()
   WHERE submission_id=p_submission_id;
   INSERT INTO public.notifications(role,title,message,link)
   VALUES(v_sub.coordinator_role,'Verifikasi manual Diklat KS selesai',
     coalesce(v_sub.title,'Diklat KS')||' menunggu persetujuan Kasi/Subkoor.','#diklatKsBcks');
 ELSE
   UPDATE public.submissions SET
     staff_verified_by=v_uid,staff_verified_at=now(),staff_verification_note=v_note,
     workflow_state='PERBAIKAN',status='REVISION',updated_at=now()
   WHERE id=p_submission_id;
   UPDATE public.ks_bcks_submission_details SET
     admin_status='DITOLAK',admin_note=v_note,
     admin_reviewed_by=v_uid,admin_reviewed_at=now(),updated_at=now()
   WHERE submission_id=p_submission_id;
   INSERT INTO public.notifications(user_id,title,message,link)
   VALUES(v_sub.user_id,'Perbaikan administrasi Diklat KS',
     v_note,'#diklatKsBcks');
 END IF;
 INSERT INTO public.submission_events(submission_id,status,note,actor_id)
 VALUES(p_submission_id,
   CASE WHEN p_approve THEN 'KS_MANUAL_VERIFIKASI_SESUAI'
        ELSE 'KS_MANUAL_PERLU_PERBAIKAN' END,
   coalesce(v_note,'Pemeriksaan manual tujuh berkas oleh staf Dinas.'),v_uid);
END;
$function$
;
REVOKE ALL ON FUNCTION public.ks_bcks_review_administrasi(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_review_administrasi(uuid,boolean,text) TO authenticated;
