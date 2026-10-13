-- REVIEW ONLY / TIDAK DITERAPKAN OTOMATIS.
-- Perlu persetujuan terpisah sebelum diterapkan pada SIMANTAB produksi.
-- Tujuan: mengganti pemeriksaan cakupan kecamatan lama pada private.pengawas_can_read_gtk_needs.
-- RLS school_gtk_needs dan school_gtk_needs_workflow sudah merujuk fungsi ini.
-- Korwil: seluruh TK/SD/PNF negeri di kecamatan sesuai grant aktif.
-- Pengawas non-Korwil: hanya NPSN Dabin aktif sesuai jenjang.
-- Akses school_master sendiri membutuhkan audit RLS tersendiri.

BEGIN;

CREATE OR REPLACE FUNCTION private.pengawas_can_read_gtk_needs(p_school_npsn text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $scope$
 WITH me AS (
  SELECT id, role, nip
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND is_active = true
    AND approval_status = 'APPROVED'
    AND role IN ('PENGAWAS','KORWIL')
  LIMIT 1
 ), target AS (
  SELECT npsn, kecamatan, school_status,
         upper(trim(coalesce(bentuk_pendidikan, jenjang, ''))) AS level
  FROM public.school_master
  WHERE npsn = p_school_npsn AND is_active = true
  LIMIT 1
 )
 SELECT COALESCE(EXISTS (
  SELECT 1
  FROM me CROSS JOIN target t
  WHERE upper(trim(coalesce(t.school_status,''))) = 'NEGERI'
    AND (
      (
        EXISTS (
         SELECT 1 FROM public.discipline_submitter_grants g
         WHERE g.user_id = me.id AND g.is_active
           AND g.submitter_kind = 'KORWIL' AND g.scope_level = 'SD'
           AND private.norm_kecamatan(g.kecamatan) = private.norm_kecamatan(t.kecamatan)
           AND private.norm_kecamatan(g.kecamatan) <> ''
        )
        AND t.level IN ('TK','SD','PNF','PKBM','SKB','SPNF','LKP')
      )
      OR (
        NOT EXISTS (
         SELECT 1 FROM public.discipline_submitter_grants g
         WHERE g.user_id = me.id AND g.is_active
           AND g.submitter_kind = 'KORWIL' AND g.scope_level = 'SD'
        )
        AND (
          (t.level = 'SD' AND EXISTS (
            SELECT 1 FROM public.tcs_sd_dabin_reference r
            WHERE r.is_active = true
              AND r.supervisor_nip = me.nip
              AND r.school_npsn = t.npsn
          ))
          OR EXISTS (
            SELECT 1 FROM public.supervisor_dabin_reference r
            WHERE r.is_active = true
              AND r.supervisor_nip = me.nip
              AND r.school_npsn = t.npsn
              AND upper(trim(coalesce(r.education_level,''))) = t.level
              AND t.level IN ('TK','SMP')
          )
        )
      )
    )
 ), false);
$scope$;

COMMIT;

-- Sebelum diterapkan: backup definisi fungsi lama, jalankan uji role Korwil,
-- Pengawas SD, SMP, TK, akun pensiun, akun tanpa Dabin, dan regression test RLS.
