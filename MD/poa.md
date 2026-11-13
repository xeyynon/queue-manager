# Plan of action (POA)

Written 2026-11-14. What is done, the next steps in order, how each is verified, what is blocked.

## Where we are
| Done | Where |
|---|---|
| Research + validated stack | research_and_decision_log.md |
| Full app code (R1-R8), build passes, 95 unit tests pass | `src/`, `tests/unit/` |
| DB + E2E tests written | `tests/db/`, `tests/e2e/` |

## Blockers and assumptions
| Item | Effect | Working assumption until answered |
|---|---|---|
| Neon connection strings not in `.env.local` | can't migrate, run DB/E2E tests, or open the app | code is complete; nothing about it is "verified working" yet |

## Next steps (in order)
| # | Step | Verified by | Status |
|---|---|---|---|
| 1 | User fills `.env.local` (Neon main + test branch, auth secret, demo login) | file exists | blocked |
| 2 | `npx drizzle-kit migrate` on both branches | tables visible | to do |
| 3 | `npm run test:db` | all green | to do |
| 4 | `npm run dev`, click through every requirement; screenshots 390/820/1280/1920 × light/dark | screenshots in `MD/ux_audit/` | to do |
| 5 | `npm run test:e2e` | all green on desktop + phone | to do |
| 6 | `npm run seed:demo`, review the dashboard | screenshot | to do |
| 7 | git init + first commit, GitHub repo (on user's go) | repo URL | to do |
| 8 | Vercel deploy + env vars, migrate prod, seed demo | live URL opens < 3 s warm | to do |
