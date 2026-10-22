-- SMART GTK: role-scoped, read-only visibility for incomplete DRAFT intake.
-- A draft is NOT an official submission, is never actionable, and must remain absent from smartgtk_workflow.
CREATE OR REPLACE FUNCTION public.smartgtk_workflow_drafts(p_page integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $fn$
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
 WHERE i.data_stage='DRAFT' AND p.is_active=true AND p.approval_status='APPROVED'
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
  WHERE i.data_stage='DRAFT' AND p.is_active=true AND p.approval_status='APPROVED'
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
$fn$;
REVOKE ALL ON FUNCTION public.smartgtk_workflow_drafts(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.smartgtk_workflow_drafts(integer) TO authenticated;
