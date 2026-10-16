-- Diklat KS/BCKS activation controls (feature gate, participant-specific block).
-- Excluded user records are operational settings and are NOT seeded here.
CREATE TABLE IF NOT EXISTS public.ks_bcks_module_control (
 singleton_key boolean PRIMARY KEY DEFAULT true CHECK(singleton_key),
 is_open boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 note text
);
INSERT INTO public.ks_bcks_module_control(singleton_key,is_open,note)
VALUES(true,true,'Diklat KS/BCKS default active') ON CONFLICT(singleton_key) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.ks_bcks_participant_blocks (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 is_blocked boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 note text
);
ALTER TABLE public.ks_bcks_module_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_bcks_participant_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ks_bcks_module_control FROM anon,authenticated;
REVOKE ALL ON public.ks_bcks_participant_blocks FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.ks_bcks_access_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_role text;
  v_active boolean;
  v_approved boolean;
  v_open boolean;
  v_blocked boolean;
  v_admin boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Harap login terlebih dahulu.'; END IF;
  SELECT role,is_active,approval_status='APPROVED' INTO v_role,v_active,v_approved
  FROM public.profiles WHERE id=v_user;
  SELECT is_open INTO v_open FROM public.ks_bcks_module_control WHERE singleton_key=true;
  SELECT is_blocked INTO v_blocked FROM public.ks_bcks_participant_blocks WHERE user_id=v_user;
  v_admin := coalesce(v_active,false) AND coalesce(v_approved,false) AND v_role IN ('SUPER_ADMIN','KABID');
  RETURN jsonb_build_object(
    'is_open',coalesce(v_open,true),
    'is_blocked',coalesce(v_blocked,false),
    'can_manage',coalesce(v_admin,false),
    'is_allowed',coalesce(v_active,false) AND coalesce(v_approved,false)
       AND (v_admin OR (coalesce(v_open,true) AND NOT coalesce(v_blocked,false)))
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.ks_bcks_participant_write_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_service text;
  v_state jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id=v_uid AND is_active=true;
  IF v_role NOT IN ('GTK','KEPALA_SEKOLAH') THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='submissions' THEN
    v_service:=NEW.service_type;
  ELSIF TG_TABLE_NAME='ks_bcks_submission_details' THEN
    v_service:='DIKLAT_KS_BCKS';
  ELSE
    SELECT service_type INTO v_service FROM public.submissions WHERE id=NEW.submission_id;
  END IF;
  IF v_service <> 'DIKLAT_KS_BCKS' THEN RETURN NEW; END IF;
  v_state:=public.ks_bcks_access_status();
  IF coalesce((v_state->>'is_blocked')::boolean,false) THEN
    RAISE EXCEPTION 'Akses Diklat KS/BCKS untuk akun ini dinonaktifkan. Hubungi admin dinas.';
  END IF;
  IF NOT coalesce((v_state->>'is_allowed')::boolean,false) THEN
    RAISE EXCEPTION 'Pendaftaran Diklat KS/BCKS sedang ditutup. Hubungi admin dinas.';
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.ks_bcks_set_module_open(p_open boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_role text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Harap login kembali.'; END IF;
  SELECT role INTO v_role FROM public.profiles
    WHERE id=v_uid AND is_active=true AND approval_status='APPROVED';
  IF v_role IS NULL OR v_role NOT IN ('SUPER_ADMIN','KABID') THEN
    RAISE EXCEPTION 'Hanya Super Admin dan Kabid yang dapat mengatur modul Diklat KS/BCKS.';
  END IF;
  IF p_open IS NULL THEN RAISE EXCEPTION 'Status harus ditentukan.'; END IF;
  UPDATE public.ks_bcks_module_control
  SET is_open=p_open,updated_at=now(),updated_by=v_uid,
    note=CASE WHEN p_open THEN 'Dibuka oleh '||v_role ELSE 'Ditutup oleh '||v_role END
  WHERE singleton_key=true;
  RETURN public.ks_bcks_access_status();
END;
$function$

REVOKE ALL ON FUNCTION public.ks_bcks_access_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_access_status() TO authenticated;
REVOKE ALL ON FUNCTION public.ks_bcks_set_module_open(boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ks_bcks_set_module_open(boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.ks_bcks_participant_write_guard() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ks_bcks_module_guard_submissions ON public.submissions;
CREATE TRIGGER ks_bcks_module_guard_submissions BEFORE INSERT OR UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.ks_bcks_participant_write_guard();
DROP TRIGGER IF EXISTS ks_bcks_module_guard_details ON public.ks_bcks_submission_details;
CREATE TRIGGER ks_bcks_module_guard_details BEFORE INSERT OR UPDATE ON public.ks_bcks_submission_details FOR EACH ROW EXECUTE FUNCTION public.ks_bcks_participant_write_guard();
DROP TRIGGER IF EXISTS ks_bcks_module_guard_files ON public.submission_files;
CREATE TRIGGER ks_bcks_module_guard_files BEFORE INSERT OR UPDATE ON public.submission_files FOR EACH ROW EXECUTE FUNCTION public.ks_bcks_participant_write_guard();
