-- SMART-GTK layered verification. Administrative follow-up only; not an SK or JF appointment.
-- Separate from smartgtk_intake: do not change participants' answers or any existing JF decision.
CREATE TABLE IF NOT EXISTS public.smartgtk_workflow (
 owner_id uuid PRIMARY KEY REFERENCES public.smartgtk_intake(owner_id) ON DELETE CASCADE,
 scope text NOT NULL CHECK (scope IN ('SD','SMP','TK_PAUD_PNF','BELUM_TERPETAKAN')),
 status text NOT NULL CHECK (status IN ('MENUNGGU_DATA','MENUNGGU_PENUGASAN','MENUNGGU_STAF','MENUNGGU_KASI','MENUNGGU_KABID','PERBAIKAN_GTK','PERBAIKAN_STAF','PERBAIKAN_KASI','SELESAI')),
 assigned_staff uuid REFERENCES public.profiles(id),
 source_updated_at timestamptz NOT NULL,
 staff_note text,
 coordinator_note text,
 kabid_note text,
 decided_by uuid REFERENCES public.profiles(id),
 decided_at timestamptz,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smartgtk_workflow_queue_idx ON public.smartgtk_workflow(scope,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS smartgtk_workflow_assigned_staff_idx ON public.smartgtk_workflow(assigned_staff,status);
ALTER TABLE public.smartgtk_workflow ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.smartgtk_workflow FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS public.smartgtk_workflow_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES public.smartgtk_intake(owner_id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES public.profiles(id),
 action text NOT NULL,
 from_status text,
 to_status text NOT NULL,
 note text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smartgtk_workflow_events_owner_idx ON public.smartgtk_workflow_events(owner_id,created_at DESC);
ALTER TABLE public.smartgtk_workflow_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.smartgtk_workflow_events FROM PUBLIC,anon,authenticated;

-- Determine route using *verified school master NPSN*, never a user-typed school name.
CREATE OR REPLACE FUNCTION private.smartgtk_scope_for_owner(p_owner uuid)
RETURNS text LANGUAGE sql STABLE SET search_path TO '' AS $fn$
 SELECT coalesce((
  SELECT CASE
   WHEN upper(btrim(coalesce(s.jenjang,s.bentuk_pendidikan,'')))='SD' THEN 'SD'
   WHEN upper(btrim(coalesce(s.jenjang,s.bentuk_pendidikan,'')))='SMP' THEN 'SMP'
   WHEN upper(btrim(coalesce(s.jenjang,s.bentuk_pendidikan,''))) IN
     ('TK','PAUD','KB','SPS','TPA','PKBM','SKB','PNF','PENDIDIKAN NONFORMAL') THEN 'TK_PAUD_PNF'
   ELSE 'BELUM_TERPETAKAN' END
  FROM public.profiles p JOIN public.school_master s ON s.npsn=p.school_npsn
  WHERE p.id=p_owner AND s.is_active=true LIMIT 1
 ), 'BELUM_TERPETAKAN');
$fn$;
REVOKE ALL ON FUNCTION private.smartgtk_scope_for_owner(uuid) FROM PUBLIC,anon,authenticated;

-- Runs in the privileged caller's transaction, never exposed to browser API.
CREATE OR REPLACE FUNCTION private.smartgtk_workflow_sync()
RETURNS void LANGUAGE plpgsql SET search_path TO '' AS $fn$
BEGIN
 INSERT INTO public.smartgtk_workflow(owner_id,scope,status,source_updated_at)
 SELECT i.owner_id,private.smartgtk_scope_for_owner(i.owner_id),
  CASE WHEN private.smartgtk_scope_for_owner(i.owner_id)='BELUM_TERPETAKAN'
    THEN 'MENUNGGU_PENUGASAN' ELSE 'MENUNGGU_PENUGASAN' END,
  i.updated_at
 FROM public.smartgtk_intake i
 WHERE i.data_stage IN ('BERKAS_LENGKAP','DATA_TERCATAT')
 ON CONFLICT(owner_id) DO NOTHING;
 -- A new intake submission invalidates old administrative review; historical audit is kept.
 UPDATE public.smartgtk_workflow w SET
   status=CASE WHEN i.data_stage IN ('BERKAS_LENGKAP','DATA_TERCATAT')
     THEN CASE WHEN w.assigned_staff IS NOT NULL AND w.scope<>'BELUM_TERPETAKAN'
       THEN 'MENUNGGU_STAF' ELSE 'MENUNGGU_PENUGASAN' END
     ELSE 'MENUNGGU_DATA' END,
   source_updated_at=i.updated_at,staff_note=NULL,coordinator_note=NULL,kabid_note=NULL,
   decided_by=NULL,decided_at=NULL,version=w.version+1,updated_at=now()
 FROM public.smartgtk_intake i
 WHERE i.owner_id=w.owner_id AND i.updated_at>w.source_updated_at;
END;
$fn$;
REVOKE ALL ON FUNCTION private.smartgtk_workflow_sync() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.smartgtk_workflow_list(p_page integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE a public.profiles%ROWTYPE; v_items jsonb; v_count integer;
BEGIN
 SELECT * INTO a FROM public.profiles WHERE id=auth.uid() AND account_channel='DINAS'
  AND approval_status='APPROVED' AND is_active=true
  AND (role IN ('KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','SUPER_ADMIN') OR role LIKE 'STAFF_%' OR role LIKE 'ADMIN_%');
 IF NOT FOUND THEN RAISE EXCEPTION 'Tidak berwenang melihat antrean SMART-GTK'; END IF;
 IF p_page IS NULL OR p_page NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Halaman tidak valid'; END IF;
 PERFORM private.smartgtk_workflow_sync();
 SELECT count(*) INTO v_count FROM public.smartgtk_workflow w WHERE
   a.role IN ('KABID','SUPER_ADMIN') OR
   (a.role='KASI_SD' AND w.scope='SD') OR
   (a.role='KASI_SMP' AND w.scope='SMP') OR
   (a.role='SUBKOOR_TK' AND w.scope='TK_PAUD_PNF') OR
   ((a.role LIKE 'STAFF_%' OR a.role LIKE 'ADMIN_%') AND w.assigned_staff=a.id);
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.last_activity DESC,x.owner_id),'[]'::jsonb) INTO v_items
 FROM (
  SELECT w.owner_id,i.full_name,i.unit_work,i.profession,i.employment,i.education,i.data_stage,
   w.scope,w.status,w.assigned_staff,staff.full_name AS staff_name,
   w.staff_note,w.coordinator_note,w.kabid_note,w.decided_at,w.version,
   w.updated_at AS last_activity,
   (SELECT count(*)::integer FROM public.smartgtk_documents d WHERE d.owner_id=w.owner_id) AS document_records
  FROM public.smartgtk_workflow w
  JOIN public.smartgtk_intake i ON i.owner_id=w.owner_id
  LEFT JOIN public.profiles staff ON staff.id=w.assigned_staff
  WHERE a.role IN ('KABID','SUPER_ADMIN') OR
   (a.role='KASI_SD' AND w.scope='SD') OR
   (a.role='KASI_SMP' AND w.scope='SMP') OR
   (a.role='SUBKOOR_TK' AND w.scope='TK_PAUD_PNF') OR
   ((a.role LIKE 'STAFF_%' OR a.role LIKE 'ADMIN_%') AND w.assigned_staff=a.id)
  ORDER BY w.updated_at DESC,w.owner_id LIMIT 50 OFFSET (p_page::bigint*50)
 ) x;
 RETURN jsonb_build_object('role',a.role,'page',p_page,'total',v_count,'items',v_items,
  'notice','Skrining dan verifikasi SMART-GTK bukan persetujuan SK/JF');
END;
$fn$;
REVOKE ALL ON FUNCTION public.smartgtk_workflow_list(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.smartgtk_workflow_list(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.smartgtk_workflow_staff()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE a public.profiles%ROWTYPE; j jsonb;
BEGIN
 SELECT * INTO a FROM public.profiles WHERE id=auth.uid() AND account_channel='DINAS'
  AND approval_status='APPROVED' AND is_active=true AND role IN ('KABID','KASI_SD','KASI_SMP','SUBKOOR_TK');
 IF NOT FOUND THEN RAISE EXCEPTION 'Hanya Kabid/Kasi/Subkoor dapat melihat daftar staf'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'role',p.role) ORDER BY p.full_name),'[]'::jsonb)
 INTO j FROM public.profiles p
 WHERE p.account_channel='DINAS' AND p.is_active=true AND p.approval_status='APPROVED'
 AND (p.role LIKE 'STAFF_%' OR p.role LIKE 'ADMIN_%');
 RETURN j;
END;
$fn$;
REVOKE ALL ON FUNCTION public.smartgtk_workflow_staff() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.smartgtk_workflow_staff() TO authenticated;

CREATE OR REPLACE FUNCTION public.smartgtk_workflow_act(
 p_owner uuid,p_action text,p_note text DEFAULT NULL,p_staff uuid DEFAULT NULL,p_scope text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE a public.profiles%ROWTYPE;w public.smartgtk_workflow%ROWTYPE;
 v_new text;v_scope text;v_note text; t public.profiles%ROWTYPE; src public.smartgtk_intake%ROWTYPE;
BEGIN
 SELECT * INTO a FROM public.profiles WHERE id=auth.uid() AND account_channel='DINAS'
 AND approval_status='APPROVED' AND is_active=true
 AND (role IN ('KABID','KASI_SD','KASI_SMP','SUBKOOR_TK') OR role LIKE 'STAFF_%' OR role LIKE 'ADMIN_%');
 IF NOT FOUND THEN RAISE EXCEPTION 'Akun Dinas tidak memiliki kewenangan untuk memproses SMART-GTK';END IF;
 PERFORM private.smartgtk_workflow_sync();
 SELECT * INTO w FROM public.smartgtk_workflow WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pengusul belum menyerahkan pendataan SMART-GTK yang lengkap';END IF;
 SELECT * INTO src FROM public.smartgtk_intake WHERE owner_id=p_owner;
 IF src.data_stage NOT IN ('BERKAS_LENGKAP','DATA_TERCATAT') OR src.updated_at>w.source_updated_at THEN
  RAISE EXCEPTION 'Data GTK berubah/masih draf; tunggu pengajuan yang lengkap';END IF;
 v_note=btrim(coalesce(p_note,''));
 IF length(v_note)>500 THEN RAISE EXCEPTION 'Catatan maksimal 500 karakter';END IF;
 IF p_action IN ('RETURN_GTK','RETURN_STAFF','RETURN_COORD') AND length(v_note)<10
 THEN RAISE EXCEPTION 'Catatan perbaikan minimal 10 karakter';END IF;
 IF a.role='KABID' THEN
  IF p_action='SET_SCOPE' AND w.scope='BELUM_TERPETAKAN' AND w.status='MENUNGGU_PENUGASAN' THEN
   IF p_scope NOT IN ('SD','SMP','TK_PAUD_PNF') THEN RAISE EXCEPTION 'Tentukan jenjang resmi';END IF;
   v_scope=p_scope;v_new='MENUNGGU_PENUGASAN';
  ELSIF p_action='APPROVE' AND w.status='MENUNGGU_KABID' AND w.scope<>'BELUM_TERPETAKAN' THEN
   v_new='SELESAI';
  ELSIF p_action='RETURN_COORD' AND w.status='MENUNGGU_KABID' THEN
   v_new='PERBAIKAN_KASI';
  ELSIF p_action='RETURN_GTK' AND w.status='MENUNGGU_KABID' THEN
   v_new='PERBAIKAN_GTK';
  ELSE RAISE EXCEPTION 'Aksi Kabid tidak sesuai tahap';END IF;
 ELSIF a.role IN ('KASI_SD','KASI_SMP','SUBKOOR_TK') THEN
  IF NOT ((a.role='KASI_SD' AND w.scope='SD') OR
     (a.role='KASI_SMP' AND w.scope='SMP') OR
     (a.role='SUBKOOR_TK' AND w.scope='TK_PAUD_PNF'))
  THEN RAISE EXCEPTION 'Kasus berada di luar jenjang kewenangan';END IF;
  IF p_action='ASSIGN_STAFF' AND w.status IN ('MENUNGGU_PENUGASAN','MENUNGGU_STAF','PERBAIKAN_STAF') THEN
   SELECT * INTO t FROM public.profiles WHERE id=p_staff AND account_channel='DINAS'
    AND is_active=true AND approval_status='APPROVED' AND (role LIKE 'STAFF_%' OR role LIKE 'ADMIN_%');
   IF NOT FOUND THEN RAISE EXCEPTION 'Staf tujuan tidak aktif atau tidak berwenang';END IF;
   v_new='MENUNGGU_STAF';
  ELSIF p_action='FORWARD_KABID' AND w.status IN ('MENUNGGU_KASI','PERBAIKAN_KASI') THEN
   v_new='MENUNGGU_KABID';
  ELSIF p_action='RETURN_STAFF' AND w.status IN ('MENUNGGU_KASI','PERBAIKAN_KASI') AND w.assigned_staff IS NOT NULL THEN
   v_new='PERBAIKAN_STAF';
  ELSIF p_action='RETURN_GTK' AND w.status IN ('MENUNGGU_KASI','PERBAIKAN_KASI') THEN
   v_new='PERBAIKAN_GTK';
  ELSE RAISE EXCEPTION 'Aksi Kasi/Subkoor tidak sesuai tahap';END IF;
 ELSIF (a.role LIKE 'STAFF_%' OR a.role LIKE 'ADMIN_%') AND w.assigned_staff=a.id THEN
  IF p_action='SEND_KASI' AND w.status IN ('MENUNGGU_STAF','PERBAIKAN_STAF') THEN
   v_new='MENUNGGU_KASI';
  ELSIF p_action='RETURN_GTK' AND w.status IN ('MENUNGGU_STAF','PERBAIKAN_STAF') THEN
   v_new='PERBAIKAN_GTK';
  ELSE RAISE EXCEPTION 'Aksi staf tidak sesuai tugas/tahap';END IF;
 ELSE RAISE EXCEPTION 'Kasus belum ditugaskan kepada akun ini';END IF;
 UPDATE public.smartgtk_workflow SET scope=coalesce(v_scope,scope),status=v_new,
  assigned_staff=CASE WHEN p_action='ASSIGN_STAFF' THEN p_staff ELSE assigned_staff END,
  staff_note=CASE WHEN p_action IN ('SEND_KASI','RETURN_GTK') AND (a.role LIKE 'STAFF_%' OR a.role LIKE 'ADMIN_%') THEN v_note ELSE staff_note END,
  coordinator_note=CASE WHEN a.role IN ('KASI_SD','KASI_SMP','SUBKOOR_TK') AND p_action<>'ASSIGN_STAFF' THEN v_note ELSE coordinator_note END,
  kabid_note=CASE WHEN a.role='KABID' AND p_action<>'SET_SCOPE' THEN v_note ELSE kabid_note END,
  decided_by=CASE WHEN p_action='APPROVE' THEN a.id ELSE NULL END,
  decided_at=CASE WHEN p_action='APPROVE' THEN now() ELSE NULL END,
  updated_at=now(),version=version+1
 WHERE owner_id=p_owner;
 INSERT INTO public.smartgtk_workflow_events(owner_id,actor_id,action,from_status,to_status,note)
 VALUES(p_owner,a.id,p_action,w.status,v_new,nullif(v_note,''));
 RETURN jsonb_build_object('ok',true,'owner_id',p_owner,'from',w.status,'status',v_new,'action',p_action);
END;
$fn$;
REVOKE ALL ON FUNCTION public.smartgtk_workflow_act(uuid,text,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.smartgtk_workflow_act(uuid,text,text,uuid,text) TO authenticated;
