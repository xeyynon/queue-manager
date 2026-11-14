# Queue Manager: MASTER

Last updated: 2026-11-14. Trust the code first, this file second. Keep this file short (<= ~15 KB); details go in topic files.

## One-line summary
A web app where a queue manager (receptionist / counter staff) creates named queues, issues tokens, reorders them, serves the top token with one click, cancels with undo, and reads wait-time analytics. Built for a graded assignment (working app, code on GitHub, good UI, bug-free).

## Status
| Area | State | Where |
|---|---|---|
| Research + stack validation | done (2026-11-13) | [research_and_decision_log.md](research_and_decision_log.md) |
| DB schema + migration | applied on Neon `main`, `dev`, `test` (DEC-022) | `src/db/schema.ts`, `drizzle/0000_init.sql` |
| Auth (email + password) | **verified** in browser + E2E (sign up, sign in, wrong password); session-expiry redirect untested | `src/server/auth.ts`, `src/app/login/` |
| Queue service (R1-R7) | **verified**: 25 DB tests pass (2026-11-14) | `src/server/queue-service.ts`, `tests/db/` |
| Analytics (R8) | **verified**: DB tests + dashboard screenshots with 30 days of demo data | `src/server/analytics-service.ts` |
| API routes | written, build passes | `src/app/api/` |
| UI: login, queues, queue console, dashboard | **verified**: 42 screenshots (4 widths × 2 themes), no console errors, no overflow | `src/app/`, `MD/ux_audit/2026-11-14/` |
| Unit tests | 95 passing (2026-11-14) | `tests/unit/` |
| E2E tests | **13 pass** twice against Neon `test`, server UTC + browser IST, console errors fail the run (2026-11-14) | `tests/e2e/` |
| Contrast check | all pairs pass both themes (2026-11-14) | `scripts/contrast.mjs` |
| Demo seed | seeded on Neon `main` (production) and `dev` (2026-11-14); ages, so re-seed before evaluation | `scripts/seed-demo.ts` |
| Deploy | **live** https://queue-manager-bice.vercel.app (Vercel sin1 + Neon Singapore); signed-in screenshot run clean. Auto-deploy pipeline written (DEC-028), waiting for GitHub secrets | `vercel.json`, `.github/workflows/ci.yml`, [deployment.md](deployment.md) |

Latest build: none tagged yet (next: build-1000) · Live at: https://queue-manager-bice.vercel.app · 
**Running on:** Neon (dev branch locally, main in production). Local Docker DB (DEC-017) no longer used.

## Roles / users
- **Queue manager** (desktop at a counter, sometimes a phone/tablet; English UI): runs one or more queues, adds/moves/serves/cancels tokens, checks the dashboard.
- **Evaluator** (desktop browser): signs up or uses the demo login, clicks through all 8 requirements, reads the GitHub repo.

## Key ideas
- **Correctness by locking:** every mutation locks its queue row (`SELECT … FOR UPDATE`) in one transaction; "Serve next" also sends the token the manager saw at the top, so a double-click or a second tab can never serve two people (DEC-005).
- **Data designed around time:** tokens carry `created_at / served_at / cancelled_at`; an append-only `queue_events` log stores every action with the waiting count after it. The dashboard and the audit trail read from these (research §3.1).
- **Honest numbers:** wait estimates need ≥3 serves in 2 h, else "—"; p90/median need ≥5 served; empty periods say so (DEC-007).
- **Fair, visible waiting (Maister):** position, live wait timer, estimated wait, "moved up by manager" badge, activity log.
- **Fast feel:** optimistic UI with rollback; mutations queued client-side in click order; undo toast instead of "are you sure?".

## Stack
Next.js 16.4 (App Router, TypeScript, Turbopack, Cache Components off) · PostgreSQL on Neon via `pg` + Drizzle ORM 0.45 · Better Auth 1.7 (email/password, Drizzle adapter) · Tailwind CSS 4 with own token-based components (no shadcn) · native `<dialog>` + Popover API · Sonner toasts · Recharts 3 · Zod 4 · Vitest 4 + Playwright 1.65 · Vercel. All versions pinned exactly. See [system_design_and_boundary.md](system_design_and_boundary.md) and [api.md](api.md).

## Mocked / deferred / out of scope
- Demo account history is **simulated** (seeded); every screen of that account says "Sample data" (DEC-010).
- No public "display board" screen for customers, no SMS/notifications, no multi-counter (one server per queue), no roles beyond manager, no password reset (no email sending). See [prd.md](prd.md).

## Document map
See [README.md](README.md).
