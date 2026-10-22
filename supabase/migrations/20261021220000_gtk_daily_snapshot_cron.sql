-- SIMANTAB GTK daily aggregate snapshots, 22–26 October 2026 (08:00 WIB).
-- No identity/PII in reports. No automatic approvals or account changes.
CREATE SCHEMA IF NOT EXISTS simantab_ops;
REVOKE ALL ON SCHEMA simantab_ops FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS simantab_ops.gtk_daily_reports (
  report_date date PRIMARY KEY,
  generated_at timestamptz NOT NULL DEFAULT now(),
  metrics jsonb NOT NULL,
  CONSTRAINT gtk_daily_reports_date_range CHECK (report_date BETWEEN DATE '2026-10-21' AND DATE '2026-10-26')
);
ALTER TABLE simantab_ops.gtk_daily_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON simantab_ops.gtk_daily_reports FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION simantab_ops.compute_gtk_daily_metrics()
RETURNS jsonb LANGUAGE sql STABLE SET search_path = ''
AS $calc$
 WITH p AS (
   SELECT id, approval_status, is_active, account_channel, school_npsn,
          coalesce(nullif(btrim(unit_gtk), ''), nullif(btrim(unit), '')) AS unit_kerja,
          regexp_replace(coalesce(nip,''),'[^0-9]','','g') AS nip_key
   FROM public.profiles
 ), nip_groups AS (
   SELECT nip_key, count(*) AS total,
          count(*) FILTER (WHERE approval_status='APPROVED' AND is_active IS TRUE) AS active_approved
   FROM p WHERE length(nip_key)=18 GROUP BY nip_key
 ), pending_triage AS (
   SELECT CASE
    WHEN length(p.nip_key)<>18 THEN 'PERIKSA_STATUS_DAN_NIP'
    WHEN coalesce(g.total,0)>1 AND g.active_approved>0 THEN 'NIP_BENTUR_AKTIF'
    WHEN coalesce(g.total,0)>1 THEN 'NIP_GANDA_TIDAK_AKTIF'
    WHEN p.unit_kerja IS NULL THEN 'LENGKAPI_UNIT'
    ELSE 'VERIFIKASI_ADMIN'
   END AS category
   FROM p LEFT JOIN nip_groups g ON p.nip_key=g.nip_key
   WHERE p.account_channel='GTK' AND p.approval_status='PENDING'
 ), active_gtk AS (
   SELECT p.id, p.school_npsn FROM p
   WHERE p.account_channel='GTK' AND p.approval_status='APPROVED' AND p.is_active IS TRUE
 ), kec AS (
   SELECT coalesce(nullif(btrim(s.kecamatan),''),'BELUM TERPETAKAN') AS kecamatan,
          count(*)::int AS akun_aktif,
          count(i.owner_id)::int AS sudah_isi
   FROM active_gtk p
   LEFT JOIN public.school_master s ON s.npsn=p.school_npsn
   LEFT JOIN public.smartgtk_intake i ON i.owner_id=p.id
   GROUP BY 1
 ), smp AS (
   SELECT p.school_npsn AS npsn, coalesce(s.school_name,p.school_npsn) AS sekolah,
          coalesce(s.kecamatan,'BELUM TERPETAKAN') AS kecamatan,
          count(*)::int AS akun_aktif,
          count(i.owner_id)::int AS sudah_isi
   FROM active_gtk p
   JOIN public.school_master s ON s.npsn=p.school_npsn
   LEFT JOIN public.smartgtk_intake i ON i.owner_id=p.id
   WHERE upper(coalesce(s.jenjang,s.bentuk_pendidikan,'')) LIKE 'SMP%'
   GROUP BY p.school_npsn,s.school_name,s.kecamatan
 )
 SELECT jsonb_build_object(
   'basis','PROFIL_GTK_TERDAFTAR_BUKAN_MASTER_SELURUH_GTK',
   'total_sasaran_resmi',NULL,
   'gtk_terdaftar',(SELECT count(*) FROM p WHERE account_channel='GTK'),
   'gtk_disetujui',(SELECT count(*) FROM p WHERE account_channel='GTK' AND approval_status='APPROVED'),
   'gtk_disetujui_aktif',(SELECT count(*) FROM active_gtk),
   'gtk_disetujui_nonaktif',(SELECT count(*) FROM p WHERE account_channel='GTK' AND approval_status='APPROVED' AND is_active IS NOT TRUE),
   'gtk_pending',(SELECT count(*) FROM p WHERE account_channel='GTK' AND approval_status='PENDING'),
   'gtk_pending_aktif_tidak_lazim',(SELECT count(*) FROM p WHERE account_channel='GTK' AND approval_status='PENDING' AND is_active IS TRUE),
   'gtk_ditolak',(SELECT count(*) FROM p WHERE account_channel='GTK' AND approval_status='REJECTED'),
   'gtk_sudah_mengisi',(SELECT count(*) FROM active_gtk a JOIN public.smartgtk_intake i ON i.owner_id=a.id),
   'gtk_belum_mengisi_akun_aktif',(SELECT count(*) FROM active_gtk a LEFT JOIN public.smartgtk_intake i ON i.owner_id=a.id WHERE i.owner_id IS NULL),
   'gtk_draf',(SELECT count(*) FROM active_gtk a JOIN public.smartgtk_intake i ON i.owner_id=a.id WHERE i.data_stage='DRAFT'),
   'gtk_berkas_lengkap',(SELECT count(*) FROM active_gtk a JOIN public.smartgtk_intake i ON i.owner_id=a.id WHERE i.data_stage='BERKAS_LENGKAP'),
   'nip_ganda_kelompok',(SELECT count(*) FROM nip_groups WHERE total>1),
   'nip_ganda_kelompok_aktif',(SELECT count(*) FROM nip_groups WHERE active_approved>1),
   'pending_triage',(SELECT coalesce(jsonb_object_agg(category,jumlah),'{}'::jsonb) FROM (SELECT category,count(*) AS jumlah FROM pending_triage GROUP BY category) q),
   'dinas_operator_pending',(SELECT count(*) FROM p WHERE account_channel='DINAS' AND approval_status='PENDING'),
   'persetujuan_batch_hari_ini',(
     SELECT count(*) FROM public.simantab_gtk_bulk_approval_audit
     WHERE outcome='APPROVED' AND (created_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date
   ),
   'per_kecamatan',(SELECT coalesce(jsonb_agg(jsonb_build_object('kecamatan',kecamatan,'aktif',akun_aktif,'mengisi',sudah_isi,'belum',akun_aktif-sudah_isi) ORDER BY kecamatan),'[]'::jsonb) FROM kec),
   'per_smp',(SELECT coalesce(jsonb_agg(jsonb_build_object('npsn',npsn,'sekolah',sekolah,'kecamatan',kecamatan,'aktif',akun_aktif,'mengisi',sudah_isi,'belum',akun_aktif-sudah_isi) ORDER BY sekolah),'[]'::jsonb) FROM smp)
 );
$calc$;
REVOKE ALL ON FUNCTION simantab_ops.compute_gtk_daily_metrics() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION simantab_ops.capture_gtk_daily_report(p_day date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SET search_path = ''
AS $capture$
DECLARE v_day date := coalesce(p_day,(now() AT TIME ZONE 'Asia/Jakarta')::date);
BEGIN
  -- Oct 21 may be captured manually as a verified baseline; cron fires Oct 22–26 only.
  IF v_day NOT BETWEEN DATE '2026-10-21' AND DATE '2026-10-26' THEN RETURN; END IF;
  INSERT INTO simantab_ops.gtk_daily_reports(report_date,generated_at,metrics)
  VALUES (v_day,now(),simantab_ops.compute_gtk_daily_metrics())
  ON CONFLICT(report_date) DO UPDATE
  SET generated_at=excluded.generated_at, metrics=excluded.metrics;
END;
$capture$;
REVOKE ALL ON FUNCTION simantab_ops.capture_gtk_daily_report(date) FROM PUBLIC, anon, authenticated;

-- Authenticated Dinas leaders can view aggregate snapshots only; never individual PII.
CREATE OR REPLACE FUNCTION public.simantab_gtk_daily_report(p_on_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $report$
DECLARE result jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id=(SELECT auth.uid()) AND account_channel='DINAS'
      AND role IN ('SUPER_ADMIN','KABID','KEPALA_DINAS','SEKRETARIS_DINAS','KASI_SD','KASI_SMP')
      AND approval_status='APPROVED' AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Tidak berwenang membaca laporan GTK harian' USING ERRCODE='42501';
  END IF;
  SELECT jsonb_build_object(
     'tanggal',r.report_date, 'dibuat_pada',r.generated_at, 'metrik',r.metrics
  ) INTO result
  FROM simantab_ops.gtk_daily_reports r
  WHERE r.report_date<=coalesce(p_on_date,(now() AT TIME ZONE 'Asia/Jakarta')::date)
  ORDER BY r.report_date DESC LIMIT 1;
  RETURN result;
END;
$report$;
REVOKE ALL ON FUNCTION public.simantab_gtk_daily_report(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.simantab_gtk_daily_report(date) TO authenticated;

-- Cron uses UTC: 01:00 UTC = 08:00 WIB. The only collection dates are 22–26 Oct 2026.
SELECT cron.schedule('simantab-gtk-0800-wib-202610','0 1 22-26 10 *',
  $job$SELECT simantab_ops.capture_gtk_daily_report();$job$);
