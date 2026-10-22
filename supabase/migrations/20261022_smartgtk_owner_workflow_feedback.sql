-- Expose only the current GTK owner's status and the latest RETURN_GTK note.
-- Does not expose internal staff review comments for other stages/users.
CREATE OR REPLACE FUNCTION public.smartgtk_workflow_my_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE v public.smartgtk_workflow%ROWTYPE; p public.profiles%ROWTYPE; n text;
BEGIN
 SELECT * INTO p FROM public.profiles WHERE id=auth.uid() AND is_active=true
  AND approval_status='APPROVED'
  AND ((account_channel='GTK' AND role IN ('GTK','KEPALA_SEKOLAH')) OR role='PENGAWAS');
 IF NOT FOUND THEN RAISE EXCEPTION 'Status khusus pemilik akun GTK aktif'; END IF;
 SELECT * INTO v FROM public.smartgtk_workflow WHERE owner_id=p.id;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','BELUM_DIPROSES'); END IF;
 IF v.status='PERBAIKAN_GTK' THEN
  SELECT e.note INTO n FROM public.smartgtk_workflow_events e
  WHERE e.owner_id=p.id AND e.to_status='PERBAIKAN_GTK'
  ORDER BY e.created_at DESC,e.id DESC LIMIT 1;
 END IF;
 RETURN jsonb_build_object('state',v.status,'note',coalesce(n,''),
  'updated_at',v.updated_at,'administrative_only',true);
END;
$fn$;
REVOKE ALL ON FUNCTION public.smartgtk_workflow_my_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.smartgtk_workflow_my_status() TO authenticated;
