-- Personalize Kabid congratulatory notes upon official 2->3 approval, plus optional atomic all-120 Kabid action.
-- This migration does not itself change any participant stage or send a notification.
CREATE OR REPLACE FUNCTION public.ks_bcks_kabid_promote_level(
  p_submission_id uuid, p_target_stage text, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','auth','pg_temp'
AS $fn$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_note text := nullif(btrim(coalesce(p_note,'')),'');
  v_sub public.submissions%rowtype;
  v_detail public.ks_bcks_submission_details%rowtype;
  v_blocked boolean;
  v_open boolean;
  v_from text;
  v_to text;
  v_event text;
  v_title text;
  v_message text;
  v_participant_name text;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Harap login kembali.'; END IF;
  SELECT role INTO v_role FROM public.profiles
    WHERE id=v_actor AND is_active=true AND approval_status='APPROVED';
  IF v_role IS DISTINCT FROM 'KABID' THEN
    RAISE EXCEPTION 'Hanya Kabid Ketenagaan yang dapat menaikkan level peserta Diklat KS/BCKS.';
  END IF;
  IF v_note IS NULL OR char_length(v_note)<15 OR char_length(v_note)>500 THEN
    RAISE EXCEPTION 'Catatan dasar keputusan wajib diisi (15–500 karakter), cantumkan nomor/tanggal dokumen hasil resmi.';
  END IF;
  SELECT is_open INTO v_open FROM public.ks_bcks_module_control
    WHERE singleton_key=true;
  IF v_open IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Modul Diklat KS/BCKS sedang tidak aktif.';
  END IF;
  SELECT * INTO v_sub FROM public.submissions
    WHERE id=p_submission_id FOR UPDATE;
  IF v_sub.id IS NULL OR v_sub.service_type<>'DIKLAT_KS_BCKS' THEN
    RAISE EXCEPTION 'Pengajuan Diklat KS/BCKS tidak ditemukan.';
  END IF;
  SELECT * INTO v_detail FROM public.ks_bcks_submission_details
    WHERE submission_id=p_submission_id FOR UPDATE;
  IF v_detail.submission_id IS NULL OR v_detail.user_id IS DISTINCT FROM v_sub.user_id
     OR coalesce(v_detail.is_archived,false) THEN
    RAISE EXCEPTION 'Peserta tidak aktif atau data Diklat tidak sesuai.';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.ks_bcks_authorized_participants a
    JOIN public.profiles p ON p.id=a.user_id
    WHERE a.user_id=v_sub.user_id AND p.role='KEPALA_SEKOLAH'
      AND p.is_active=true AND p.approval_status='APPROVED'
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: peserta bukan anggota 120 peserta resmi.';
  END IF;
  SELECT is_blocked INTO v_blocked FROM public.ks_bcks_participant_blocks
    WHERE user_id=v_sub.user_id;
  IF coalesce(v_blocked,false) THEN
    RAISE EXCEPTION 'Akun peserta diblokir khusus modul Diklat KS/BCKS.';
  END IF;
  IF v_sub.workflow_state<>'SELESAI' OR v_sub.kabid_approved_at IS NULL
      AND v_sub.status NOT IN ('ADMIN_APPROVED','SUBSTANSI_LULUS') THEN
    RAISE EXCEPTION 'Administrasi peserta belum disetujui Kabid.';
  END IF;
  v_from:=v_detail.workflow_stage;
  v_to:=upper(btrim(coalesce(p_target_stage,'')));

  IF v_from='SUBSTANSI' AND v_to='DIKLAT'
    AND v_detail.admin_status IN ('DISETUJUI','TERVERIFIKASI')
    AND v_detail.substansi_status='MENUNGGU'
    AND v_sub.status='ADMIN_APPROVED' THEN
    v_participant_name := btrim(coalesce(
      nullif(btrim(v_detail.full_name),''),
      (SELECT nullif(btrim(p.full_name),'') FROM public.profiles p WHERE p.id=v_sub.user_id),
      'Peserta'
    ));
    v_message := 'Selamat Bpk/Ibu KS '||v_participant_name||
      ', lulus seleksi substansi. Persiapkan diri untuk mengikuti Diklat KS. '||
      'Jaga kesehatan fisik, mental, dan pikiran. '||
      'Semoga sukses menyelesaikan seluruh tahapan dengan baik, tetap sehat dan semangat🤲🤲👍👍';
    UPDATE public.ks_bcks_submission_details
       SET substansi_status='LULUS',substansi_note=v_message,
           substansi_reviewed_by=v_actor,substansi_reviewed_at=now(),
           workflow_stage='DIKLAT',diklat_status='MENUNGGU',updated_at=now()
     WHERE submission_id=p_submission_id;
    UPDATE public.submissions SET status='SUBSTANSI_LULUS',updated_at=now()
     WHERE id=p_submission_id;
    v_event:='DIKLAT_KS_KABID_NAIK_LEVEL_3';
    v_title:='Naik Level 3: Diklat KS/BCKS';
    -- v_message is a per-user personalized congratulation, stored in substansi_note.
  ELSIF v_from='DIKLAT' AND v_to='SERTIFIKAT'
    AND v_detail.substansi_status='LULUS'
    AND v_detail.diklat_status='MENUNGGU'
    AND v_sub.status='SUBSTANSI_LULUS' THEN
    UPDATE public.ks_bcks_submission_details
       SET diklat_status='LULUS',diklat_note=v_note,
           diklat_reviewed_by=v_actor,diklat_reviewed_at=now(),
           workflow_stage='SERTIFIKAT',sertifikat_status='MENUNGGU_PENCATATAN',
           updated_at=now()
     WHERE submission_id=p_submission_id;
    UPDATE public.submissions SET status='DIKLAT_LULUS',updated_at=now()
      WHERE id=p_submission_id;
    v_event:='DIKLAT_KS_KABID_NAIK_LEVEL_4';
    v_title:='Naik Level 4: Pencatatan Sertifikat';
    v_message:='Kabid telah menetapkan hasil Diklat dan membuka Level 4 (Pencatatan Sertifikat).';
  ELSE
    RAISE EXCEPTION 'Perpindahan level tidak sah atau hasil tahap sebelumnya belum memenuhi syarat (% -> %).',v_from,v_to;
  END IF;
  INSERT INTO public.submission_events(submission_id,status,note,actor_id)
   VALUES(p_submission_id,v_event,'Keputusan Kabid: '||v_note,v_actor);
  INSERT INTO public.notifications(user_id,title,message,link)
   VALUES(v_sub.user_id,v_title,
     CASE WHEN v_to='DIKLAT' THEN v_message ELSE v_message||' Dasar keputusan: '||v_note END,
     '#diklatKsBcks');
  RETURN jsonb_build_object('ok',true,'from_stage',v_from,'to_stage',v_to,
    'submission_id',p_submission_id);
END;
$fn$;
REVOKE ALL ON FUNCTION public.ks_bcks_kabid_promote_level(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_kabid_promote_level(uuid,text,text) TO authenticated;
COMMENT ON FUNCTION public.ks_bcks_kabid_promote_level(uuid,text,text)
IS 'Kabid-only audited advancement for official 120 participants. Transition 2->3 stores personalized congratulations in participant substansi_note, notifications, and official decision basis in submission_events.';


-- Batch promotion is Kabid-triggered (never automatic): all and only the 120 official members.
CREATE OR REPLACE FUNCTION public.ks_bcks_kabid_promote_all_120(p_note text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','auth','pg_temp'
AS $fn$
DECLARE
  v_actor uuid := auth.uid();
  v_note text := nullif(btrim(coalesce(p_note,'')),'');
  v_total integer;
  v_eligible integer;
  v_promoted integer := 0;
  v_case record;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id=v_actor AND p.role='KABID'
      AND p.is_active=true AND p.approval_status='APPROVED'
  ) THEN
    RAISE EXCEPTION 'Hanya Kabid Ketenagaan aktif yang dapat menetapkan kenaikan 120 peserta.';
  END IF;
  IF v_note IS NULL OR char_length(v_note)<15 OR char_length(v_note)>500 THEN
    RAISE EXCEPTION 'Catatan dasar kelulusan resmi wajib, 15–500 karakter (cantumkan nomor/tanggal dokumen).';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.ks_bcks_module_control WHERE singleton_key=true AND is_open=true) THEN
    RAISE EXCEPTION 'Modul Diklat KS/BCKS belum aktif.';
  END IF;

  SELECT count(*) INTO v_total FROM public.ks_bcks_authorized_participants;
  IF v_total<>120 THEN
    RAISE EXCEPTION 'Operasi dibatalkan: kohort resmi harus 120 akun; terdeteksi %.',v_total;
  END IF;
  SELECT count(*) INTO v_eligible
  FROM public.ks_bcks_authorized_participants a
  JOIN public.ks_bcks_submission_details d ON d.user_id=a.user_id
  JOIN public.submissions s ON s.id=d.submission_id
  JOIN public.profiles p ON p.id=a.user_id
  WHERE d.is_archived=false AND d.workflow_stage='SUBSTANSI'
    AND d.admin_status IN ('DISETUJUI','TERVERIFIKASI')
    AND d.substansi_status='MENUNGGU'
    AND s.service_type='DIKLAT_KS_BCKS' AND s.workflow_state='SELESAI'
    AND s.status='ADMIN_APPROVED'
    AND p.role='KEPALA_SEKOLAH' AND p.is_active=true AND p.approval_status='APPROVED'
    AND NOT EXISTS(
      SELECT 1 FROM public.ks_bcks_participant_blocks b
      WHERE b.user_id=a.user_id AND b.is_blocked=true
    );
  IF v_eligible<>120 THEN
    RAISE EXCEPTION 'Operasi dibatalkan: hanya % dari 120 peserta siap. Gunakan tindakan per peserta untuk data yang berbeda.',v_eligible;
  END IF;

  FOR v_case IN
    SELECT d.submission_id FROM public.ks_bcks_authorized_participants a
    JOIN public.ks_bcks_submission_details d ON d.user_id=a.user_id
    ORDER BY d.submission_id
  LOOP
    PERFORM public.ks_bcks_kabid_promote_level(v_case.submission_id,'DIKLAT',v_note);
    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok',true,'promoted',v_promoted,'from_stage','SUBSTANSI','to_stage','DIKLAT',
    'personalized_messages',v_promoted
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.ks_bcks_kabid_promote_all_120(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_kabid_promote_all_120(text) TO authenticated;
COMMENT ON FUNCTION public.ks_bcks_kabid_promote_all_120(text)
IS 'Atomic all-120 official BCKS transition 2->3, Kabid-only, requiring official decision evidence and generating individual personalized account notes/notifications.';
