-- SIMANTAB: persetujuan agregat hanya untuk akun GTK dengan NIP ASN unik.
-- Endpoint Cloudflare tidak pernah memanggil RPC ini dengan anon/user JWT.
-- Setiap eksekusi memeriksa ulang status/role/NIP dan mencatat audit atomik.
CREATE TABLE IF NOT EXISTS public.simantab_gtk_bulk_approval_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 batch_id uuid NOT NULL,
 actor_id uuid NOT NULL,
 target_id uuid NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('APPROVED','SKIPPED')),
 detail text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.simantab_gtk_bulk_approval_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.simantab_gtk_bulk_approval_audit FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.simantab_gtk_bulk_approval_audit_id_seq FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.simantab_gtk_bulk_approval_audit TO service_role;
GRANT USAGE ON SEQUENCE public.simantab_gtk_bulk_approval_audit_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.simantab_gtk_bulk_approve_one(
 _target uuid, _actor uuid, _batch uuid
) RETURNS TABLE(outcome text, detail text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
 p public.profiles%ROWTYPE;
 key_nip text;
 reason text;
 n integer;
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM public.profiles a
   WHERE a.id=_actor AND a.role='SUPER_ADMIN'
     AND a.is_active=true AND a.approval_status='APPROVED'
 ) THEN RAISE EXCEPTION 'Hanya Super Admin aktif yang disetujui.'
     USING ERRCODE='42501';
 END IF;

 SELECT * INTO p FROM public.profiles WHERE id=_target FOR UPDATE;
 IF NOT FOUND THEN
    reason := 'Profil tidak ditemukan';
 ELSE
    key_nip := regexp_replace(coalesce(p.nip,''),'[^0-9]','','g');
    -- Locks repeated attempts for an identical normalized NIP.
    IF length(key_nip)=18 THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('simantab-nip:'||key_nip,0));
    END IF;
    IF p.approval_status<>'PENDING' OR p.account_channel<>'GTK' OR p.is_active=true THEN
      reason := 'Status, kanal atau aktivasi telah berubah';
    ELSIF p.role NOT IN ('GTK','KEPALA_SEKOLAH','PENGAWAS')
       OR p.requested_role NOT IN ('GTK','KEPALA_SEKOLAH','PENGAWAS') THEN
      reason := 'Peran di luar jalur GTK';
    ELSIF length(btrim(coalesce(p.full_name,'')))<3 THEN
      reason := 'Nama belum lengkap';
    ELSIF coalesce(nullif(btrim(p.unit_gtk),''),nullif(btrim(p.unit),'')) IS NULL THEN
      reason := 'Unit kerja kosong';
    ELSIF p.nip !~ '^[0-9]{18}$' THEN
      reason := 'NIP ASN belum tepat 18 digit';
    ELSE
      SELECT count(*) INTO n FROM public.profiles other
       WHERE other.id<>_target
         AND regexp_replace(coalesce(other.nip,''),'[^0-9]','','g')=key_nip;
      IF n>0 THEN
        reason := 'NIP terdaftar pada akun lain ('||n||')';
      ELSIF p.requested_role='KEPALA_SEKOLAH' AND NOT EXISTS (
          SELECT 1 FROM public.school_master s
          WHERE s.npsn=p.school_npsn AND s.is_active=true
            AND upper(coalesce(s.school_status,''))='NEGERI'
      ) THEN
        reason := 'NPSN sekolah negeri aktif belum cocok';
      END IF;
    END IF;
 END IF;

 IF reason IS NOT NULL THEN
   INSERT INTO public.simantab_gtk_bulk_approval_audit
      (batch_id,actor_id,target_id,outcome,detail)
      VALUES(_batch,_actor,_target,'SKIPPED',reason);
   RETURN QUERY SELECT 'SKIPPED'::text,reason;
   RETURN;
 END IF;

 UPDATE public.profiles
 SET role=p.requested_role, approval_status='APPROVED', is_active=true,
     updated_at=now()
 WHERE id=_target AND approval_status='PENDING' AND account_channel='GTK' AND is_active=false;
 IF NOT FOUND THEN
   reason:='Status berubah sebelum disetujui';
   INSERT INTO public.simantab_gtk_bulk_approval_audit
      (batch_id,actor_id,target_id,outcome,detail)
      VALUES(_batch,_actor,_target,'SKIPPED',reason);
   RETURN QUERY SELECT 'SKIPPED'::text,reason;
   RETURN;
 END IF;
 INSERT INTO public.simantab_gtk_bulk_approval_audit
      (batch_id,actor_id,target_id,outcome,detail)
      VALUES(_batch,_actor,_target,'APPROVED','Disetujui melalui verifikasi agregat NIP unik');
 RETURN QUERY SELECT 'APPROVED'::text,'Berhasil disetujui'::text;
END
$$;
REVOKE ALL ON FUNCTION public.simantab_gtk_bulk_approve_one(uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.simantab_gtk_bulk_approve_one(uuid,uuid,uuid) TO service_role;
COMMENT ON FUNCTION public.simantab_gtk_bulk_approve_one(uuid,uuid,uuid)
 IS 'Dipanggil hanya dari Edge Function berotorisasi Super Admin, memeriksa ulang NIP dan status, serta mengaudit setiap keputusan.';
