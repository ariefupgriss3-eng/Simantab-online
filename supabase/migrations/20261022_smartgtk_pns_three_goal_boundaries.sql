-- Enforce PNS-only 3-goal analysis and PNS-only multi-role workflow at all server boundaries.
-- PPPK / PPPK-PW entries remain in smartgtk_intake and private dedicated buffers.
-- Previous non-PNS workflow rows remain archived in place but are invisible and cannot be approved.
CREATE OR REPLACE FUNCTION public.smartgtk_classify(e text, sk text, nomen text, formasi text, edu text, old_jf text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare n text:='TIDAK_TERINDIKASI'; a text:='TIDAK_TERINDIKASI'; q text:='TIDAK_TERINDIKASI';
begin
 if e IS DISTINCT FROM 'PNS' then
   return jsonb_build_object('nomenklatur','DATABASE_ONLY',
    'pengangkatan','DATABASE_ONLY','kualifikasi','DATABASE_ONLY',
    'hasil','PENDATAAN_BUKAN_USULAN','versi',3,
    'catatan','Hanya PNS Guru/Kepala Sekolah masuk analisis tiga tujuan SMART GTK.');
 end if;
 if e='PNS' then
   if sk='YA' then
     if btrim(coalesce(old_jf,''))='' or nomen='BELUM_TAHU' then n:='PERLU_DATA';
     elsif nomen='TIDAK' then n:='POTENSI_USUL';
     else n:='TIDAK_TERINDIKASI'; end if;
   elsif sk='BELUM_TAHU' then n:='PERLU_DATA'; end if;
   if sk='TIDAK' then
     if formasi='YA' then
       if edu in ('S1','DIV','S2','S3') then a:='POTENSI_USUL';
       else a:='TERTAHAN_KUALIFIKASI'; end if;
     elsif formasi='BELUM_TAHU' then a:='PERLU_DATA'; end if;
   elsif sk='BELUM_TAHU' then a:='PERLU_DATA'; end if;
 end if;
 if edu in ('DI','DII','DIII') then q:='PERLU_PEMENUHAN_2030';
 elsif edu in ('SLTA','SPG') then q:='TELAAH_KHUSUS';
 elsif edu in ('S1','DIV','S2','S3') then q:='DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI';
 else q:='PERLU_DATA'; end if;
 return jsonb_build_object(
   'nomenklatur',n,'pengangkatan',a,'kualifikasi',q,
   'hasil','SKRINING_AWAL_BUKAN_KEPUTUSAN',
   'versi',1,
   'catatan','Kelayakan final mengikuti surat dan peraturan yang berlaku serta pemeriksaan dokumen petugas.'
 );
end;
$function$
;

CREATE OR REPLACE FUNCTION private.smartgtk_workflow_sync()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
 INSERT INTO public.smartgtk_workflow(owner_id,scope,status,source_updated_at)
 SELECT i.owner_id,private.smartgtk_scope_for_owner(i.owner_id),
  CASE WHEN private.smartgtk_scope_for_owner(i.owner_id)='BELUM_TERPETAKAN'
    THEN 'MENUNGGU_PENUGASAN' ELSE 'MENUNGGU_PENUGASAN' END,
  i.updated_at
 FROM public.smartgtk_intake i
 WHERE i.employment='PNS' AND i.profession IN ('GURU','KEPALA_SEKOLAH') AND i.data_stage IN ('BERKAS_LENGKAP','DATA_TERCATAT')
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
 WHERE i.owner_id=w.owner_id AND i.employment='PNS' AND i.profession IN ('GURU','KEPALA_SEKOLAH') AND i.updated_at>w.source_updated_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.smartgtk_workflow_act(p_owner uuid, p_action text, p_note text DEFAULT NULL::text, p_staff uuid DEFAULT NULL::uuid, p_scope text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 IF src.employment IS DISTINCT FROM 'PNS' OR src.profession NOT IN ('GURU','KEPALA_SEKOLAH') OR src.data_stage NOT IN ('BERKAS_LENGKAP','DATA_TERCATAT') OR src.updated_at>w.source_updated_at THEN
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
$function$
;

CREATE OR REPLACE FUNCTION public.smartgtk_workflow_list(p_page integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a public.profiles%ROWTYPE; v_items jsonb; v_count integer;
BEGIN
 SELECT * INTO a FROM public.profiles WHERE id=auth.uid() AND account_channel='DINAS'
  AND approval_status='APPROVED' AND is_active=true
  AND (role IN ('KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','SUPER_ADMIN') OR role LIKE 'STAFF_%' OR role LIKE 'ADMIN_%');
 IF NOT FOUND THEN RAISE EXCEPTION 'Tidak berwenang melihat antrean SMART-GTK'; END IF;
 IF p_page IS NULL OR p_page NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Halaman tidak valid'; END IF;
 PERFORM private.smartgtk_workflow_sync();
 SELECT count(*) INTO v_count FROM public.smartgtk_workflow w JOIN public.smartgtk_intake si ON si.owner_id=w.owner_id AND si.employment='PNS' AND si.profession IN ('GURU','KEPALA_SEKOLAH') WHERE
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
  JOIN public.smartgtk_intake i ON i.owner_id=w.owner_id AND i.employment='PNS' AND i.profession IN ('GURU','KEPALA_SEKOLAH')
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
$function$
;

CREATE OR REPLACE FUNCTION public.smartgtk_workflow_drafts(p_page integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 a public.profiles%ROWTYPE;
 v_count integer;
 v_items jsonb;
BEGIN
 SELECT * INTO a FROM public.profiles
 WHERE id=auth.uid() AND account_channel='DINAS'
   AND is_active=true AND approval_status='APPROVED'
   AND role IN ('KABID','SUPER_ADMIN','KASI_SD','KASI_SMP','SUBKOOR_TK');
 IF NOT FOUND THEN RAISE EXCEPTION 'Tidak berwenang melihat draf SMART GTK'; END IF;
 IF p_page IS NULL OR p_page NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Halaman tidak valid'; END IF;
 SELECT count(*) INTO v_count
 FROM public.smartgtk_intake i
 JOIN public.profiles p ON p.id=i.owner_id
 WHERE i.data_stage='DRAFT' AND i.employment='PNS' AND i.profession IN ('GURU','KEPALA_SEKOLAH') AND p.is_active=true AND p.approval_status='APPROVED'
 AND (
   a.role IN ('KABID','SUPER_ADMIN') OR
   (a.role='KASI_SD' AND private.smartgtk_scope_for_owner(i.owner_id)='SD') OR
   (a.role='KASI_SMP' AND private.smartgtk_scope_for_owner(i.owner_id)='SMP') OR
   (a.role='SUBKOOR_TK' AND private.smartgtk_scope_for_owner(i.owner_id)='TK_PAUD_PNF')
 );
 SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.last_activity DESC,x.owner_id),'[]'::jsonb)
 INTO v_items
 FROM (
  SELECT i.owner_id, i.full_name,
    COALESCE(NULLIF(btrim(p.unit_gtk),''),NULLIF(btrim(p.unit),''),i.unit_work) AS unit_work,
    i.profession,i.employment,i.data_stage,i.updated_at AS last_activity,
    private.smartgtk_scope_for_owner(i.owner_id) AS scope,
    (SELECT count(*)::integer FROM public.smartgtk_documents d WHERE d.owner_id=i.owner_id) AS document_records
  FROM public.smartgtk_intake i
  JOIN public.profiles p ON p.id=i.owner_id
  WHERE i.data_stage='DRAFT' AND i.employment='PNS' AND i.profession IN ('GURU','KEPALA_SEKOLAH') AND p.is_active=true AND p.approval_status='APPROVED'
    AND (
      a.role IN ('KABID','SUPER_ADMIN') OR
      (a.role='KASI_SD' AND private.smartgtk_scope_for_owner(i.owner_id)='SD') OR
      (a.role='KASI_SMP' AND private.smartgtk_scope_for_owner(i.owner_id)='SMP') OR
      (a.role='SUBKOOR_TK' AND private.smartgtk_scope_for_owner(i.owner_id)='TK_PAUD_PNF')
    )
  ORDER BY i.updated_at DESC,i.owner_id
  LIMIT 50 OFFSET (p_page::bigint*50)
 ) x;
 RETURN jsonb_build_object('total',v_count,'page',p_page,'items',v_items,
  'read_only',true,'notice','Draf belum diselesaikan oleh GTK: tidak dapat ditugaskan, diverifikasi, atau disetujui');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.smartgtk_mass_officer_list(p_page integer DEFAULT 0)
 RETURNS TABLE(owner_id uuid, full_name text, unit_work text, profession text, employment text, education text, data_stage text, screening jsonb, docs_present integer, required_count integer, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas';end if;
 if p_page is null or p_page<0 or p_page>10000 then raise exception 'Halaman tidak valid';end if;
 return query select v.owner_id,v.full_name,v.unit_work,v.profession,v.employment,
   v.education,v.data_stage,
   public.smartgtk_mass_classify(v.profession,v.employment,v.jf_sk,
    v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position),
   (select count(*)::integer from public.smartgtk_documents d
      join storage.objects o on o.bucket_id=d.source_bucket and o.name=d.storage_path
      where d.owner_id=v.owner_id and
      (d.source_bucket='simantab-smartgtk-private' and d.cabinet_file_id is null
       or d.source_bucket='simantab-documents' and exists(
        select 1 from public.smartgtk_locker_files x
        where x.id=d.cabinet_upload_id and x.owner_id=d.owner_id
         and x.storage_path=d.storage_path and x.doc_type=d.doc_type
         and x.file_size between 1 and 1572864 and x.mime_type in ('application/pdf','image/jpeg','image/png'))
       or d.source_bucket='simantab-documents' and exists(
        select 1 from public.submission_files sf where sf.id=d.cabinet_file_id and sf.user_id=d.owner_id
         and sf.storage_path=d.storage_path and sf.file_size between 1 and 1572864 and length(sf.storage_path)<=220
         and sf.mime_type in ('application/pdf','image/jpeg','image/png')
          and private.smartgtk_cabinet_file_matches(d.doc_type,sf.requirement_code,sf.file_name)))),
   cardinality(public.smartgtk_mass_required_docs(v.profession,v.employment,v.jf_sk,
    v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position)),
   v.updated_at
 from public.smartgtk_intake v WHERE v.employment='PNS' AND v.profession IN ('GURU','KEPALA_SEKOLAH') order by v.updated_at desc,v.owner_id
 limit 50 offset (p_page::bigint*50);
end;
$function$
;
