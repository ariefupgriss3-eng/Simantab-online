-- SIMANTAB 2026-10-22: akun dengan data profil kosong dapat disetujui Super Admin.
-- NIP ganda/keliru, role salah, NPSN Kepala Sekolah tidak cocok tetap ditolak.
-- Tujuh data profil wajib diisi sesudah login sebelum membuka layanan.
CREATE OR REPLACE FUNCTION public.simantab_gtk_bulk_approve_one(_target uuid, _actor uuid, _batch uuid)
 RETURNS TABLE(outcome text, detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    IF p.approval_status<>'PENDING' OR p.account_channel<>'GTK' THEN
      reason := 'Status, kanal atau aktivasi telah berubah';
    ELSIF p.role NOT IN ('GTK','KEPALA_SEKOLAH','PENGAWAS')
       OR p.requested_role NOT IN ('GTK','KEPALA_SEKOLAH','PENGAWAS') THEN
      reason := 'Peran di luar jalur GTK';
    ELSIF length(btrim(coalesce(p.full_name,'')))<3 THEN
      reason := 'Nama belum lengkap';
    -- NIP dan unit kosong dilengkapi setelah persetujuan.
    ELSIF btrim(coalesce(p.nip,''))<>'' AND p.nip !~ '^[0-9]{18}$' THEN
      reason := 'NIP terisi tetapi bukan 18 digit';
    ELSE
      n:=0;
      IF length(key_nip)=18 THEN
        SELECT count(*) INTO n FROM public.profiles other
         WHERE other.id<>_target
           AND regexp_replace(coalesce(other.nip,''),'[^0-9]','','g')=key_nip;
      END IF;
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
 WHERE id=_target AND approval_status='PENDING' AND account_channel='GTK';
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
      VALUES(_batch,_actor,_target,'APPROVED','Disetujui via agregat; profil wajib dilengkapi sebelum layanan');
 RETURN QUERY SELECT 'APPROVED'::text,'Disetujui; lengkapi profil wajib sebelum layanan'::text;
END
$function$
;
REVOKE EXECUTE ON FUNCTION public.simantab_gtk_bulk_approve_one(uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
