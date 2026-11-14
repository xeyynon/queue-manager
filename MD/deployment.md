# Deployment

Last verified: 2026-11-14.

| Piece | Where | Notes |
|---|---|---|
| App | Vercel project `queue-manager` (team surya-pratiks-projects), functions in `sin1` | Live: https://queue-manager-bice.vercel.app |
| Database | Neon project `queue-manager` (curly-dust-57177870), `aws-ap-southeast-1` | branches: `main` (prod), `dev` (local), `test` (tests) |

## Production environment variables (Vercel, production, all "Hidden Secret")
`DATABASE_URL` (Neon `main`, pooled) · `BETTER_AUTH_SECRET` (own value, not the dev one) · `DEMO_EMAIL` · `DEMO_PASSWORD` · `DEMO_TZ`.
`BETTER_AUTH_URL` is not set: auth uses `VERCEL_PROJECT_PRODUCTION_URL` (DEC-024).

## Deploy (automatic, DEC-028)
Push to `main` → GitHub Actions `CI / Deploy`: check → DB + E2E tests on Neon `test` → migrate Neon `main` → Vercel production deploy → smoke test. A failing step stops the release; the live site keeps the previous version. Pull requests run check + tests only.

One-time setup (owner): `bash scripts/setup-github-secrets.sh` sets TEST_DATABASE_URL, PROD_DATABASE_URL, VERCEL_ORG_ID, VERCEL_PROJECT_ID and asks for a Vercel token (create at https://vercel.com/account/tokens).

Manual fallback: `vercel deploy --prod` from `queue-manager/`.
After a deploy, optional visual check: `node scripts/screenshots.mjs https://queue-manager-bice.vercel.app MD/ux_audit/<date>-production`.

## Schema changes
`npx drizzle-kit generate` and commit the new file in `drizzle/`. Locally: `npx drizzle-kit migrate` (dev). `main` is migrated by the pipeline before each deploy; `test` migrates itself in `tests/db/setup.ts`. Keep migrations backward-compatible (the old code runs for a minute against the new schema).

## Before the evaluation
1. Re-seed the demo on `main` (same command with `DATABASE_URL` = main) so "waiting now" and Today look current.
2. Open the site once to wake the Neon compute (scale-to-zero).

## Measured (2026-11-14, from India, curl)
`/login` 200 in 0.67–0.81 s (3 requests). Signed-out `/queues` → 307 to `/login`; `/api/queues` → 401.
