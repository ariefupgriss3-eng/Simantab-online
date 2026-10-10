# SIMANTAB Online - Migration to Cloudflare (staging only)

## Strict production safety

- Branch `migration/cloudflare-staging` is independent from `main`.
- Existing Vercel, Supabase production database, participants, exam answers, grades, documents and domains must not be changed.
- Do not deploy this branch as the production SIMANTAB.
- Current Cloudflare staging bootstrap has **no Supabase bindings**, **no AI API keys**, and all API requests (except the staging health check) are blocked with HTTP 503.
- Do not copy any private key, member record or exam answer into a public GitHub commit.
- Additional paid subscriptions or project creation require separate user approval.
- Staging can be tested with synthetic data; never run a reset, delete or write test against production Supabase.

## Verified source architecture (GitHub main)

- Frontend is assembled by `web/secure-build.mjs`, `web/build.mjs`, multiple injection scripts and PWA patching.
- Current build downloads the existing HTML from `https://simantab-online.vercel.app/`, then applies local and remote patches.
- Current build output is the Vercel Build Output API path `.vercel/output/static`; a standalone, reproducible static build remains to be implemented.
- `web/api/bcks-thinking.js` implements AI Coach / reinforcement / transfer scoring using Vercel AI Gateway and its secret `AI_GATEWAY_API_KEY`.
- `web/diklat-ai-read-edge.js` implements Diklat document AI and references Vercel Gateway and `VERCEL_OIDC_TOKEN`.
- `web/jabfung-ai-read-edge.js` similarly processes Jabfung AI and references Vercel Gateway and `VERCEL_OIDC_TOKEN`.
- Android/PWA entrypoints and cache updates must be retested separately.

## Immediate engineering tasks

1. **Freeze an audited, non-sensitive frontend source snapshot** in an isolated location, so all future builds can work without fetching the Vercel production website. Verify its provenance and any embedded public config.
2. Make the frontend build deterministic, from local version-controlled source, with no network dependency on Vercel or mutable GitHub main.
3. Build actual SIMANTAB web output for Cloudflare static assets; compare screen flows and PWA behavior with the live application read-only.
4. Replace Vercel-specific AI endpoints with Cloudflare Worker routes using **private worker secrets** and a cost-controlled AI provider. No AI features are activated until authentication, role checks, response schema, rate limits and logging are validated.
5. Prepare isolated Supabase read-only tests (or a separate database with synthetic data). Never test writes on live tables.
6. Test login, RBAC, administrative services, telemetry, report exports, browser reload, PDF, PWA, and Android compatibility. Compare behavior and measured quota use.
7. Only after successful testing and a cutover/rollback plan: connect a staging hostname. DNS and production changes require a separate decision.

## Files created in this branch

- `web/cloudflare-staging/wrangler.jsonc`: free-tier-compatible Worker and assets configuration.
- `web/cloudflare-staging/worker.mjs`: staging health endpoint; all other API requests safely blocked.
- `web/cloudflare-staging/public/index.html`: static informational landing page, not SIMANTAB application.
- `web/cloudflare-staging/worker.test.mjs`: safety smoke tests runnable using `node --test worker.test.mjs`.
- `web/vercel.json`: disable automatic Vercel preview builds for this migration branch.

## Running isolated smoke tests

```sh
cd web/cloudflare-staging
node --test worker.test.mjs
```

Do not run `wrangler deploy` until staging code and Cloudflare account connections are separately reviewed. No Cloudflare deployment has been attempted.
