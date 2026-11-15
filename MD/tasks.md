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
- [x] Commit + push the B-01…B-07 fixes (2026-11-14, 1fe0b15)
- [x] Neon project + dev/test/main branches, migrated, demo seeded on main + dev (2026-11-14, DEC-022)
- [x] Deployed: https://queue-manager-bice.vercel.app (2026-11-14, DEC-023/024); production screenshot run clean
- [x] Fixed B-08…B-11 found against Neon/production (2026-11-14, uncommitted)
- [x] Pipeline deploys on push to main (DEC-028) — verified 2026-11-14, run 43584822144 (e975158)
- [x] GitHub secrets set by the user (2026-11-14), team-scoped Vercel token
- [x] First automatic deploy (2026-11-14)
- [ ] Re-seed demo on `main` right before the evaluation (demo "waiting" times age otherwise)
- [ ] Make the repo public / add evaluators before submission

## P1
- [x] UI/UX audit: 14 findings (A-01…A-14) fixed, plus 2 found while checking (2026-11-15, branch `ux-audit-fixes`, `MD/ux_audit/2026-11-15-audit.md`)
- [ ] Merge `ux-audit-fixes` to main (deploys), then write `MD/builds/build-1000.md` and tag `build-1000`
- [ ] Answer audit questions Q-1 (long-wait threshold per queue), Q-2 (`A` shortcut adds at once), Q-3 (show "Now" in the phone's docked bar)
- [x] Seed demo account and review the dashboard with it (2026-11-14, local DB)
- [ ] README screenshots grid
- [ ] build-1000 report

## Cut first
- [ ] P2 items in prd.md
