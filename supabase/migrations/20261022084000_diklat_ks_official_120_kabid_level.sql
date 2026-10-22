-- SIMANTAB: access only official 120 Diklat KS/BCKS participants; Kabid-only individual level decisions.
-- Cohort is an immutable snapshot: a new enrolment needs an explicit authorised database change.
DO $block$
DECLARE n integer;
BEGIN
  SELECT count(distinct d.user_id) INTO n
  FROM public.ks_bcks_submission_details d
  JOIN public.submissions s ON s.id = d.submission_id
  JOIN public.profiles p ON p.id = d.user_id
  WHERE coalesce(d.is_archived,false)=false
    AND s.service_type='DIKLAT_KS_BCKS'
    AND s.workflow_state='SELESAI'
    AND s.status='ADMIN_APPROVED'
    AND p.role='KEPALA_SEKOLAH'
    AND p.is_active=true AND p.approval_status='APPROVED';
  IF n<>120 THEN
    RAISE EXCEPTION 'Kohort Diklat KS/BCKS harus tepat 120 peserta, ditemukan %', n;
  END IF;
END
$block$;

CREATE TABLE IF NOT EXISTS public.ks_bcks_authorized_participants(
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'KOHORT_DIKLAT_KS_2026_120'
);
ALTER TABLE public.ks_bcks_authorized_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ks_bcks_authorized_participants FROM PUBLIC,anon,authenticated;
INSERT INTO public.ks_bcks_authorized_participants(user_id)
SELECT DISTINCT d.user_id
FROM public.ks_bcks_submission_details d
JOIN public.submissions s ON s.id=d.submission_id
JOIN public.profiles p ON p.id=d.user_id
WHERE coalesce(d.is_archived,false)=false
  AND s.service_type='DIKLAT_KS_BCKS'
  AND s.workflow_state='SELESAI' AND s.status='ADMIN_APPROVED'
  AND p.role='KEPALA_SEKOLAH'
  AND p.is_active=true AND p.approval_status='APPROVED'
ON CONFLICT (user_id) DO NOTHING;
DO $block$
BEGIN
  IF (SELECT count(*) FROM public.ks_bcks_authorized_participants)<>120 THEN
    RAISE EXCEPTION 'Daftar akses Diklat KS/BCKS tidak tepat 120 akun';
  END IF;
END $block$;

CREATE OR REPLACE FUNCTION public.ks_bcks_access_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','auth','pg_temp'
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_role text;
  v_active boolean;
  v_approved boolean;
  v_open boolean;
  v_blocked boolean;
  v_admin boolean;
  v_cohort boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Harap login terlebih dahulu.'; END IF;
  SELECT role,is_active,approval_status='APPROVED'
    INTO v_role,v_active,v_approved FROM public.profiles WHERE id=v_user;
  SELECT is_open INTO v_open FROM public.ks_bcks_module_control WHERE singleton_key=true;
  SELECT is_blocked INTO v_blocked FROM public.ks_bcks_participant_blocks WHERE user_id=v_user;
  SELECT EXISTS(
    SELECT 1 FROM public.ks_bcks_authorized_participants WHERE user_id=v_user
  ) INTO v_cohort;
  v_admin:=coalesce(v_active,false) AND coalesce(v_approved,false)
    AND v_role IN ('SUPER_ADMIN','KABID');
  RETURN jsonb_build_object(
    'is_open',coalesce(v_open,false),
    'is_blocked',coalesce(v_blocked,false),
    'is_cohort_member',coalesce(v_cohort,false),
    'can_manage',coalesce(v_admin,false),
    'is_allowed',coalesce(v_active,false) AND coalesce(v_approved,false)
      AND (v_admin OR(
         v_role='KEPALA_SEKOLAH' AND coalesce(v_open,false)
         AND coalesce(v_cohort,false) AND NOT coalesce(v_blocked,false)
      ))
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.ks_bcks_access_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_access_status() TO authenticated;

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
    UPDATE public.ks_bcks_submission_details
       SET substansi_status='LULUS',substansi_note=v_note,
           substansi_reviewed_by=v_actor,substansi_reviewed_at=now(),
           workflow_stage='DIKLAT',diklat_status='MENUNGGU',updated_at=now()
     WHERE submission_id=p_submission_id;
    UPDATE public.submissions SET status='SUBSTANSI_LULUS',updated_at=now()
     WHERE id=p_submission_id;
    v_event:='DIKLAT_KS_KABID_NAIK_LEVEL_3';
    v_title:='Naik Level 3: Diklat KS/BCKS';
    v_message:='Kabid telah menetapkan hasil Seleksi Substansi dan menaikkan Anda ke Level 3 (Diklat).';
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
   VALUES(v_sub.user_id,v_title,v_message||' Dasar keputusan: '||v_note,'#diklatKsBcks');
  RETURN jsonb_build_object('ok',true,'from_stage',v_from,'to_stage',v_to,
    'submission_id',p_submission_id);
END;
$fn$;
REVOKE ALL ON FUNCTION public.ks_bcks_kabid_promote_level(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_kabid_promote_level(uuid,text,text) TO authenticated;
COMMENT ON FUNCTION public.ks_bcks_kabid_promote_level(uuid,text,text)
IS 'Kabid-only individual, audited stage advance 2->3 or 3->4 for the fixed official 120-person Diklat KS/BCKS cohort. Note must identify official decision record.';
