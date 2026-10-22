-- Kepala Sekolah of state schools must submit Kebutuhan GTK Riil before using SMART-GTK.
-- Preserve GTK/teacher and pengawas access, existing pilot rollout, and non-state school policy.
-- "Submitted" means SUBMITTED/VERIFIED/APPROVED; a DRAFT or REVISION is insufficient.
CREATE OR REPLACE FUNCTION private.smartgtk_current_user_can_participate()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.profiles p
  JOIN public.smartgtk_rollout_settings config ON config.id=true
  WHERE p.id=auth.uid()
    AND p.is_active=true AND p.approval_status='APPROVED'
    AND ((p.account_channel='GTK' AND p.role IN ('GTK','KEPALA_SEKOLAH')) OR p.role='PENGAWAS')
    AND (config.mode='OPEN' OR (config.mode='PILOT' AND EXISTS(
      SELECT 1 FROM public.smartgtk_pilot_users x WHERE x.owner_id=p.id AND x.enabled=true
    )))
    AND (
      p.role<>'KEPALA_SEKOLAH' OR EXISTS(
        SELECT 1 FROM public.school_master school
        WHERE school.npsn=p.school_npsn AND school.is_active=true
          AND (
            UPPER(BTRIM(COALESCE(school.school_status,'')))<>'NEGERI'
            OR EXISTS(
              SELECT 1 FROM public.school_gtk_needs_workflow needs
              WHERE needs.school_npsn=school.npsn
                AND UPPER(BTRIM(COALESCE(needs.status,''))) IN
                  ('SUBMITTED','VERIFIED','APPROVED')
            )
          )
      )
    )
 );
$function$;
-- Not a browser-callable endpoint; only internal SMART-GTK functions use this helper.
REVOKE ALL ON FUNCTION private.smartgtk_current_user_can_participate() FROM PUBLIC,anon,authenticated;
