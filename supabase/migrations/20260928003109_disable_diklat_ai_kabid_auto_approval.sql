alter table public.submissions
  disable trigger trg_ks_bcks_ai_kabid_approve;

alter table public.submission_events
  disable trigger trg_ks_bcks_ai_kabid_after_verifier_event;

comment on trigger trg_ks_bcks_ai_kabid_approve on public.submissions
is 'NONAKTIF: AI Persetujuan Kabid otomatis Diklat KS/BCKS. Persetujuan Kabid dilakukan manual melalui submission_kabid_approve.';

comment on trigger trg_ks_bcks_ai_kabid_after_verifier_event on public.submission_events
is 'NONAKTIF: pemicu AI Persetujuan Kabid dari event AI Verifikator. Persetujuan Kabid dilakukan manual.';
