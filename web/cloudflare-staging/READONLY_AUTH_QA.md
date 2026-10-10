# SIMANTAB Cloudflare — Authorization Integration Gate

**Status:** staging code only, read-only, offline CI. **Not deployed.**

## Current evidence
- `auth-boundary.mjs` checks verified user ID, active and approved status, role-derived login channel, password-change flag, and trusted service assignment.
- `supabase-auth-readonly.mjs` is restricted to existing Supabase project `tizxfzvgglkokzvsiwkg`, a publishable key, three read-only endpoints, GET only, redirects forbidden, and user-ID filters.
- `auth-integration-gate.mjs` is disabled by default; a single, separately approved test account UUID is required before any read can proceed.
- Unit tests use injected synthetic transport only. No production token or actual Supabase Auth connection has been tested.
- The staging Cloudflare Worker **does not import or route** the real auth adapter. Its default CSP blocks browser scripts and network connections, and production API paths return HTTP 503.
- A preview that blocks scripts is not proof that the live SIMANTAB user interface works on Cloudflare.

## Gate before any live read-only test
1. Obtain explicit authorization for a dedicated, non-participant account with no sensitive submissions. Do not reuse active examination accounts.
2. Keep the expected test user ID and short-lived access token in the approved private testing environment. **Never commit tokens, passwords, refresh tokens, account IDs or log transcripts to the public repository. Do not send them in chat.**
3. Execute only the read-only verification locally with the authorized test subject, after verifying the environment's permitted origin and DNS. No writes, resets, migrations, role changes or deployment.
4. Accept only the synthetic probe summary: pass/fail, role/channel/scope, no personal data.
5. Independently verify Supabase RLS and all direct-browser data accesses, especially profiles, exam results and staff assignments. UI role-based hiding and this probe do **not** replace database row-level permissions.
6. Never enable production AI integrations until budget guardrails, quotas, authentication, and feature-specific authorization are independently tested.
7. Preserve Vercel as production and the emergency exam deployment until a separate cutover, rollback and data-integrity plan is approved.

## Security and policy caveats from read-only Supabase audit
- `profiles` allows self-read or read by a Dinas actor; `team_task_assignments` also allows owner/Dinas reads. Both have RLS enabled. Therefore the Cloudflare adapter must filter explicitly to the verified user ID, despite broader possible database read permission.
- `private.current_role()` tests `is_active`, not `approval_status`; audit RLS on each sensitive table before relying on role/status as a server-side authority. The new gateway's APPROVED check does not retroactively change the existing direct Supabase browser access.
- `PENGAWAS` and `KEPALA_SEKOLAH` must use GTK login based on their role, even where old `account_channel` is DINAS.
- Only trusted server routes may select `requiredCapability`. Client role/capability claims must be ignored.
- Existing enrollment/approval exceptions are not automatically corrected and require separate operational review.

## Remaining milestones
- Authorized non-participant test account and private read-only connection, with evidence recorded without personal identifiers.
- Test application-level RLS under that account, including negative permission tests; audit access to protected exam information.
- Backend adaptation for `/api/diklat-ai-read`, `/api/jabfung-ai-read` and `/api/bcks-thinking`, separately from synthetic fixtures.
- Integrated visual/manual QA of actual frontend interactions on non-production deployment and documented rollback.
- No domain/DNS change or Vercel downgrade before signoff.
