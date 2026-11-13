# Tasks

Status: `[ ]` to do · `[/]` in progress · `[x]` done · `[~]` dropped or deferred (say why).
When you tick something, add the date and the build or InBul that carried it.

## P0
- [x] Scaffold Next.js 16.4 app, pin all versions (2026-11-14)
- [x] Schema + first migration (`drizzle/0000_init.sql`) (2026-11-14)
- [x] Auth (Better Auth email/password) + login page (2026-11-14)
- [x] Queue service: create/rename/delete, add, move, serve, cancel, restore (2026-11-14)
- [x] Analytics service + dashboard UI (2026-11-14)
- [x] Queue list + queue console UI (optimistic, undo, shortcuts, activity log) (2026-11-14)
- [x] Unit tests (95 passing), contrast script, colour/token guard tests (2026-11-14)
- [x] DB integration tests + E2E specs written (2026-11-14)
- [x] Local Docker Postgres (DEC-017); migrated dev + test (2026-11-14)
- [x] `npm run test:db`: 25/25 (2026-11-14); removing the lock makes 8 fail, so the tests do guard the locking
- [x] Browser check: 42 screenshots, 390/820/1280/1920 × light/dark, no console errors or overflow (2026-11-14, `MD/ux_audit/2026-11-14/`)
- [x] `npm run test:e2e`: 13 passed + 1 skipped (keyboard on phone) (2026-11-14)
- [x] Fixed B-01…B-07 (2026-11-14, uncommitted)
- [x] git init, first commit 1efdb34, GitHub repo xeyynon/queue-manager (now private) (2026-11-14)
- [ ] Commit + push the B-01…B-07 fixes (when the user asks)
- [ ] **User:** Neon project + `test` branch, then swap `.env.local`, migrate, seed
- [ ] Deploy to Vercel + Neon; seed demo; warm the DB before the demo

## P1
- [x] Seed demo account and review the dashboard with it (2026-11-14, local DB)
- [ ] README screenshots grid
- [ ] build-1000 report

## Cut first
- [ ] P2 items in prd.md
