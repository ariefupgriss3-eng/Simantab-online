-- Public PTK/ASN aggregate from Pusdatin PTK–BKN HTML source.
-- Only for snapshot comparison, NEVER writes to school_master or school_gtk_needs.
CREATE TABLE IF NOT EXISTS public.gtk_public_bkn_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 status text NOT NULL DEFAULT 'PREPARING' CHECK (status IN ('PREPARING','COMPLETE','FAILED')),
 source_url text NOT NULL DEFAULT 'https://referensi.data.kemendikdasmen.go.id/ptk-bkn/data_ptk?level=2&wilayah=032500',
 source_type text NOT NULL DEFAULT 'PUBLIC_WEBPAGE_NOT_API',
 started_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 initiated_by uuid REFERENCES auth.users(id),
 source_districts integer NOT NULL DEFAULT 0,
 source_schools integer NOT NULL DEFAULT 0,
 matched_schools integer NOT NULL DEFAULT 0,
 unmatched_schools integer NOT NULL DEFAULT 0,
 matched_total_ptk bigint NOT NULL DEFAULT 0,
 matched_total_asn bigint NOT NULL DEFAULT 0,
 note text
);
CREATE TABLE IF NOT EXISTS public.gtk_public_bkn_school_snapshot (
 run_id uuid NOT NULL REFERENCES public.gtk_public_bkn_runs(id) ON DELETE CASCADE,
 npsn text NOT NULL,
 school_name_source text,
 school_status_source text,
 total_ptk integer NOT NULL CHECK(total_ptk>=0),
 total_asn integer NOT NULL CHECK(total_asn>=0 AND total_asn<=total_ptk),
 district_code text NOT NULL CHECK(district_code ~ '^0325[0-9]{2}$'),
 source_url text NOT NULL,
 fetched_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(run_id,npsn)
);
CREATE INDEX IF NOT EXISTS gtk_public_bkn_school_snapshot_npsn_idx
 ON public.gtk_public_bkn_school_snapshot(npsn);
CREATE INDEX IF NOT EXISTS gtk_public_bkn_runs_completed_idx
 ON public.gtk_public_bkn_runs(completed_at DESC) WHERE status='COMPLETE';
ALTER TABLE public.gtk_public_bkn_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtk_public_bkn_school_snapshot ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gtk_public_bkn_runs FROM anon,authenticated;
REVOKE ALL ON public.gtk_public_bkn_school_snapshot FROM anon,authenticated;
GRANT SELECT ON public.gtk_public_bkn_runs TO authenticated;
GRANT SELECT ON public.gtk_public_bkn_school_snapshot TO authenticated;
DROP POLICY IF EXISTS bkn_runs_leadership_read ON public.gtk_public_bkn_runs;
CREATE POLICY bkn_runs_leadership_read ON public.gtk_public_bkn_runs
 FOR SELECT TO authenticated
 USING (status='COMPLETE' AND EXISTS(
 SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
 AND p.role IN ('SUPER_ADMIN','KABID') AND p.is_active=true AND p.approval_status='APPROVED'));
DROP POLICY IF EXISTS bkn_school_leadership_read ON public.gtk_public_bkn_school_snapshot;
CREATE POLICY bkn_school_leadership_read ON public.gtk_public_bkn_school_snapshot
 FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.gtk_public_bkn_runs r WHERE r.id=run_id AND r.status='COMPLETE')
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
 AND p.role IN ('SUPER_ADMIN','KABID') AND p.is_active=true AND p.approval_status='APPROVED'));
COMMENT ON TABLE public.gtk_public_bkn_school_snapshot IS
'PTK-ASN public HTML aggregate snapshot by NPSN; does not imply teacher-only ASN, and must not alter Dapodik master.';
