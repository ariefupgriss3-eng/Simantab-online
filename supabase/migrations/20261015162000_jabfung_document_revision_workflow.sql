-- SIMANTAB Cloudflare / Jabfung: versioned document corrections, no duplicate submissions.
-- All writes use audited SECURITY DEFINER RPCs; historical uploaded files remain untouched.
CREATE TABLE IF NOT EXISTS public.jabfung_revision_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 requested_codes text[] NOT NULL,
 staff_note text NOT NULL,
 state text NOT NULL DEFAULT 'OPEN'
   CONSTRAINT jabfung_revision_state_check CHECK (state IN ('OPEN','SUBMITTED','CLOSED')),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 submitted_at timestamptz,
 closed_by uuid REFERENCES public.profiles(id),
 closed_at timestamptz,
 CONSTRAINT jabfung_revision_codes_nonempty CHECK (cardinality(requested_codes) BETWEEN 1 AND 12),
 CONSTRAINT jabfung_revision_note_nonempty CHECK (char_length(btrim(staff_note)) BETWEEN 8 AND 1500)
);
CREATE UNIQUE INDEX IF NOT EXISTS jabfung_revision_one_active
 ON public.jabfung_revision_requests(submission_id) WHERE state IN ('OPEN','SUBMITTED');
CREATE INDEX IF NOT EXISTS jabfung_revision_by_owner
 ON public.jabfung_revision_requests(owner_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.jabfung_revision_uploads (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 revision_id uuid NOT NULL REFERENCES public.jabfung_revision_requests(id) ON DELETE CASCADE,
 submission_file_id uuid NOT NULL UNIQUE REFERENCES public.submission_files(id) ON DELETE RESTRICT,
 requirement_code text NOT NULL,
 uploaded_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT jabfung_revision_one_file_per_code UNIQUE (revision_id,requirement_code)
);

-- This helper checks authority against the real assigned staff/coordinator, never client role labels.
CREATE OR REPLACE FUNCTION private.jabfung_revision_staff_allowed(p_submission_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO public,private,pg_temp AS $$
DECLARE
 v_uid uuid := auth.uid();
 v_role text;
 v_active boolean;
 v_approved text;
 v_s public.submissions%rowtype;
BEGIN
 IF v_uid IS NULL THEN RETURN false; END IF;
 SELECT role,is_active,approval_status INTO v_role,v_active,v_approved
 FROM public.profiles WHERE id=v_uid;
 IF v_active IS DISTINCT FROM true OR v_approved IS DISTINCT FROM 'APPROVED'
 THEN RETURN false; END IF;
 SELECT * INTO v_s FROM public.submissions WHERE id=p_submission_id AND service_type='E_JABFUNG';
 IF NOT FOUND THEN RETURN false; END IF;
 IF v_role IN ('SUPER_ADMIN','KABID') THEN RETURN true; END IF;
 IF v_role IN ('KASI_SD','KASI_SMP','SUBKOOR_TK')
    AND v_s.coordinator_role=v_role THEN RETURN true; END IF;
 IF v_role IN ('STAFF_KP_EKIN','STAFF_USUL_SK') AND
   (v_s.assigned_user_id=v_uid OR EXISTS(
       SELECT 1 FROM public.submission_assignees a
       WHERE a.submission_id=p_submission_id AND a.user_id=v_uid))
 THEN RETURN true; END IF;
 RETURN false;
END $$;
REVOKE ALL ON FUNCTION private.jabfung_revision_staff_allowed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.jabfung_revision_staff_allowed(uuid) TO authenticated;

ALTER TABLE public.jabfung_revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jabfung_revision_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.jabfung_revision_requests,public.jabfung_revision_uploads FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.jabfung_revision_requests,public.jabfung_revision_uploads TO authenticated;

CREATE POLICY jabfung_revision_request_read ON public.jabfung_revision_requests FOR SELECT TO authenticated
USING (owner_id=auth.uid() OR private.jabfung_revision_staff_allowed(submission_id));
CREATE POLICY jabfung_revision_upload_read ON public.jabfung_revision_uploads FOR SELECT TO authenticated
USING (EXISTS (
 SELECT 1 FROM public.jabfung_revision_requests r
 WHERE r.id=jabfung_revision_uploads.revision_id
 AND (r.owner_id=auth.uid() OR private.jabfung_revision_staff_allowed(r.submission_id))
));

CREATE OR REPLACE FUNCTION public.jabfung_revision_open(
 p_submission_id uuid,p_requested_codes text[],p_note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public,private,storage,pg_temp AS $$
DECLARE
 v_sub public.submissions%rowtype;
 v_count integer;
 v_id uuid;
BEGIN
 IF NOT private.jabfung_revision_staff_allowed(p_submission_id) THEN
   RAISE EXCEPTION 'Akses ditolak. Hanya petugas berwenang boleh meminta perbaikan Jabfung.';
 END IF;
 SELECT * INTO v_sub FROM public.submissions WHERE id=p_submission_id FOR UPDATE;
 IF NOT FOUND OR v_sub.service_type<>'E_JABFUNG'
    OR v_sub.workflow_state NOT IN ('VERIFIKASI_STAF','MENUNGGU_DISPOSISI_KOORDINATOR','PERBAIKAN')
 THEN RAISE EXCEPTION 'Pengajuan bukan Jabfung aktif yang dapat diminta perbaikan.'; END IF;
 IF p_requested_codes IS NULL OR cardinality(p_requested_codes) NOT BETWEEN 1 AND 12 OR
    cardinality(p_requested_codes)<>(
     SELECT count(DISTINCT code) FROM unnest(p_requested_codes) AS code
    ) THEN RAISE EXCEPTION 'Pilih 1–12 jenis berkas tanpa duplikasi.'; END IF;
 SELECT count(*) INTO v_count
 FROM public.service_requirements r
 WHERE r.service_type='E_JABFUNG' AND r.is_active AND r.requirement_type='DOCUMENT'
   AND r.code=ANY(p_requested_codes);
 IF v_count<>cardinality(p_requested_codes) THEN
   RAISE EXCEPTION 'Jenis berkas Jabfung tidak valid.'; END IF;
 IF char_length(btrim(coalesce(p_note,''))) NOT BETWEEN 8 AND 1500
 THEN RAISE EXCEPTION 'Tuliskan alasan/keterangan perbaikan (minimal 8 karakter).'; END IF;
 INSERT INTO public.jabfung_revision_requests(submission_id,owner_id,requested_codes,staff_note,created_by)
 VALUES(v_sub.id,v_sub.user_id,p_requested_codes,btrim(p_note),auth.uid())
 RETURNING id INTO v_id;
 RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.jabfung_revision_submit(
 p_revision_id uuid,p_files jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public,private,storage,pg_temp AS $$
DECLARE
 v_r public.jabfung_revision_requests%rowtype;
 v_s public.submissions%rowtype;
 v_uid uuid := auth.uid();
 v_item jsonb;
 v_code text;
 v_name text;
 v_path text;
 v_mime text;
 v_size bigint;
 v_actual_size bigint;
 v_actual_type text;
 v_prefix text;
 v_file_id uuid;
 v_seen text[]:=ARRAY[]::text[];
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Sesi login tidak tersedia.'; END IF;
 SELECT * INTO v_r FROM public.jabfung_revision_requests WHERE id=p_revision_id FOR UPDATE;
 IF NOT FOUND OR v_r.state<>'OPEN' OR v_r.owner_id<>v_uid
 THEN RAISE EXCEPTION 'Permintaan perbaikan tidak aktif atau bukan milik akun ini.'; END IF;
 SELECT * INTO v_s FROM public.submissions
 WHERE id=v_r.submission_id AND user_id=v_uid AND service_type='E_JABFUNG';
 IF NOT FOUND THEN RAISE EXCEPTION 'Pengajuan Jabfung tidak sesuai akun.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=v_uid AND is_active
                AND approval_status='APPROVED') THEN
   RAISE EXCEPTION 'Akun belum aktif/disetujui.'; END IF;
 IF jsonb_typeof(p_files) IS DISTINCT FROM 'array'
   OR jsonb_array_length(p_files)<>cardinality(v_r.requested_codes)
 THEN RAISE EXCEPTION 'Unggah semua jenis berkas yang diminta sebelum mengirim perbaikan.'; END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_files)
 LOOP
   v_code := v_item->>'code';
   v_name := btrim(coalesce(v_item->>'file_name',''));
   v_path := v_item->>'storage_path';
   v_mime := v_item->>'mime_type';
   IF v_code IS NULL OR NOT(v_code=ANY(v_r.requested_codes)) OR v_code=ANY(v_seen)
   THEN RAISE EXCEPTION 'Jenis berkas tidak sesuai permintaan perbaikan.'; END IF;
   v_seen:=array_append(v_seen,v_code);
   IF char_length(v_name) NOT BETWEEN 1 AND 180 OR
      v_mime NOT IN ('application/pdf','image/jpeg','image/png')
   THEN RAISE EXCEPTION 'Nama atau format berkas tidak valid.'; END IF;
   BEGIN
     v_size := (v_item->>'file_size')::bigint;
   EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
     RAISE EXCEPTION 'Ukuran berkas tidak valid.';
   END;
   IF v_size IS NULL OR v_size<1 OR v_size>1572864
   THEN RAISE EXCEPTION 'Ukuran tiap berkas maksimal 1,5 MB.'; END IF;
   v_prefix:=v_uid::text||'/'||v_s.id::text||'/jabfung-revisi/'||
             v_r.id::text||'/'||v_code||'/';
   IF v_path IS NULL OR left(v_path,length(v_prefix))<>v_prefix OR
      char_length(v_path)>500 OR char_length(v_path)<=length(v_prefix)
   THEN RAISE EXCEPTION 'Lokasi unggahan berkas tidak sesuai pengajuan.'; END IF;
   SELECT (o.metadata->>'size')::bigint,o.metadata->>'mimetype'
   INTO v_actual_size,v_actual_type
   FROM storage.objects o
   WHERE o.bucket_id='simantab-documents' AND o.name=v_path
   LIMIT 1;
   IF v_actual_size IS NULL OR v_actual_size<>v_size OR v_actual_type IS DISTINCT FROM v_mime
   THEN RAISE EXCEPTION 'File belum tersimpan atau metadata unggahan tidak sesuai.'; END IF;
   INSERT INTO public.submission_files
    (submission_id,user_id,storage_path,file_name,file_size,mime_type,requirement_code)
   VALUES (v_s.id,v_uid,v_path,v_name,v_size,v_mime,v_code)
   RETURNING id INTO v_file_id;
   INSERT INTO public.jabfung_revision_uploads(revision_id,submission_file_id,requirement_code)
   VALUES(v_r.id,v_file_id,v_code);
 END LOOP;
 UPDATE public.jabfung_revision_requests
 SET state='SUBMITTED',submitted_at=now()
 WHERE id=v_r.id;
 RETURN cardinality(v_seen);
END $$;

CREATE OR REPLACE FUNCTION public.jabfung_revision_close(p_revision_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public,private,pg_temp AS $$
DECLARE v_r public.jabfung_revision_requests%rowtype;
BEGIN
 SELECT * INTO v_r FROM public.jabfung_revision_requests WHERE id=p_revision_id FOR UPDATE;
 IF NOT FOUND OR v_r.state<>'SUBMITTED'
 THEN RAISE EXCEPTION 'Perbaikan belum terkirim atau sudah ditutup.'; END IF;
 IF NOT private.jabfung_revision_staff_allowed(v_r.submission_id)
 THEN RAISE EXCEPTION 'Akses petugas tidak sesuai kewenangan Jabfung.'; END IF;
 UPDATE public.jabfung_revision_requests
 SET state='CLOSED',closed_by=auth.uid(),closed_at=now()
 WHERE id=v_r.id;
 RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.jabfung_revision_open(uuid,text[],text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.jabfung_revision_submit(uuid,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.jabfung_revision_close(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.jabfung_revision_open(uuid,text[],text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jabfung_revision_submit(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jabfung_revision_close(uuid) TO authenticated;
COMMENT ON TABLE public.jabfung_revision_requests IS 'Perbaikan dokumen Jabfung per pengajuan: siklus OPEN-SUBMITTED-CLOSED tanpa menggandakan pengajuan.';
COMMENT ON TABLE public.jabfung_revision_uploads IS 'Riwayat file koreksi Jabfung, file lama tetap tersimpan dan bisa diaudit.';
