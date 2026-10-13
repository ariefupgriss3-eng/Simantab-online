-- REVIEW ONLY: NOT APPLIED TO PRODUCTION.
-- Purpose: give active Korwil *read-only* visibility into GTK/KS submissions
-- mapped by requester.school_npsn to an active TK/SD/PNF within their granted kecamatan.
-- Excludes every SMP, mismatched district, unassigned GTK without NPSN,
-- and offline consultation records. No document, NIP, description, or edit grant exposed.
-- Back up schema and test using authenticated Korwil/other user JWTs on staging first.

BEGIN;

CREATE OR REPLACE FUNCTION public.korwil_monitor_submissions()
RETURNS TABLE (
  id uuid,
  submitted_at timestamptz,
  service_type text,
  title text,
  status text,
  workflow_state text,
  requester_name text,
  school_name text,
  school_npsn text,
  school_level text,
  district text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $scope$
WITH me AS (
  SELECT id
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND is_active = true AND approval_status = 'APPROVED'
    AND account_channel = 'DINAS'
    AND role IN ('PENGAWAS','KORWIL')
),
granted AS (
  SELECT DISTINCT private.norm_kecamatan(g.kecamatan) AS kec
  FROM public.discipline_submitter_grants g JOIN me ON me.id=g.user_id
  WHERE g.is_active = true AND g.submitter_kind = 'KORWIL'
    AND g.scope_level = 'SD'
    AND private.norm_kecamatan(g.kecamatan) <> ''
),
visible AS (
  SELECT s.id, s.submitted_at, s.service_type, s.title,
         s.status, s.workflow_state, requester.full_name,
         m.school_name, m.npsn,
         CASE
          WHEN upper(coalesce(m.bentuk_pendidikan,'')) = 'TK' OR upper(coalesce(m.jenjang,'')) = 'TK' THEN 'TK'
          WHEN upper(coalesce(m.bentuk_pendidikan,'')) = 'SD' OR upper(coalesce(m.jenjang,'')) = 'SD' THEN 'SD'
          WHEN upper(coalesce(m.bentuk_pendidikan,'')) IN ('PNF','PKBM','SKB','SPNF','LKP')
               OR upper(coalesce(m.jenjang,'')) = 'PNF' THEN 'PNF'
          ELSE NULL
         END AS level,
         private.norm_kecamatan(m.kecamatan) AS kec
  FROM public.submissions s
  JOIN public.profiles requester ON requester.id = s.user_id
  JOIN public.school_master m ON m.npsn = requester.school_npsn AND m.is_active = true
  JOIN granted g ON g.kec = private.norm_kecamatan(m.kecamatan)
  WHERE requester.role IN ('GTK','KEPALA_SEKOLAH')
    AND s.service_type NOT ILIKE '%KONSULTASI_LURING%'
    AND s.service_type NOT IN ('OFFLINE_CONSULTATION','KONSULTASI_TATAP_MUKA')
)
SELECT visible.id,visible.submitted_at,visible.service_type,visible.title,
       visible.status,visible.workflow_state,visible.full_name,
       visible.school_name,visible.npsn,visible.level,visible.kec
FROM visible WHERE visible.level IS NOT NULL
ORDER BY visible.submitted_at DESC,visible.id
LIMIT 1000;
$scope$;

REVOKE ALL ON FUNCTION public.korwil_monitor_submissions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.korwil_monitor_submissions() FROM anon;
GRANT EXECUTE ON FUNCTION public.korwil_monitor_submissions() TO authenticated;

COMMIT;

-- TEST PLAN before enabling on production:
-- * Korwil Limpung: 8 current mappable submissions / NPSN in TK+SD,
--   no 6 SMP and no offline queue.
-- * Korwil Subah: only granted TK+SD(+PNF when master populated).
-- * Ordinary Pengawas SD/SMP/TK: zero rows.
-- * GTK, KS, anonymous, retired Korwil: zero rows or denied.
-- * Profiles missing school_npsn: never guessed or exposed.
-- * No permission to UPDATE/DELETE another user's submissions.
-- * Check EXPLAIN ANALYZE and keep existing submissions RLS unchanged.
