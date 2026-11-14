# Queue Manager

A token queue system for walk-in counters (clinic, bank, office). A manager signs in, creates named queues, issues tokens, reorders them, serves the top token with one click, cancels with undo, and reads wait-time analytics.

> **Live:** https://queue-manager-bice.vercel.app · Use **"Fill in the demo login"** on the sign-in page to explore 30 days of **simulated** sample data (labelled on every screen), or create your own empty account.

## Requirements → where they live

| # | Requirement | In the app | Code | Tests |
|---|---|---|---|---|
| 1 | Login, create queues | `/login`, `/queues` | `src/server/auth.ts`, `queue-service.ts › createQueue` | `tests/db` R1/R2, `tests/e2e` |
| 2 | Each queue has a name | New queue form, Settings → rename | `lib/validation.ts › queueNameSchema` | R1/R2 |
| 3 | Add persons/tokens | "Add token" or key `A` | `addToken` | R3/R4 (incl. 20 parallel adds) |
| 4 | List of waiting tokens | Queue screen list | `getQueueState`, `WaitingList.tsx` | R3/R4, e2e |
| 5 | Move up / down | ↑ ↓ on each row | `moveToken` | R5 (incl. concurrent moves) |
| 6 | Serve the top token in one click | "Serve next #N" or key `S` | `serveNext` | R6 (double-click → exactly one serve) |
| 7 | Cancel a token | ✕ on each row, Undo toast | `cancelToken`, `restoreToken` | R7 |
| 8 | Analytics dashboard | `/dashboard` | `analytics-service.ts`, `dashboard/` | R8 |

## What makes it robust
- **No double serving.** Every change to a queue runs in one transaction that locks the queue row (`SELECT … FOR UPDATE`). "Serve next" also sends the token the manager saw at the top; if anything changed, nobody is served and the screen refreshes. Tested with 10 simultaneous serve requests.
- **Ownership on every query.** Another manager's queue looks exactly like a missing one (404).
- **Honest numbers.** Estimated waits use Little's Law on the recent serving pace and show "—" until there are 3 serves in the last 2 hours; percentiles need 5 served.
- **Audit trail.** Every add, move, serve, cancel and undo is logged with who and when, and shown on the queue screen.
- **Feels instant.** Optimistic updates with rollback; requests sent in click order; undo instead of "are you sure?".

## Stack
Next.js 16 (App Router, TypeScript) · PostgreSQL (Neon) · Drizzle ORM · Better Auth · Tailwind CSS 4 · Recharts · Zod · Vitest · Playwright · Vercel. Every choice is reasoned with sources in [MD/research_and_decision_log.md](MD/research_and_decision_log.md) and [MD/decisions.md](MD/decisions.md).

## Run it locally
Requires Node 20+ and a Postgres database (a free [Neon](https://neon.com) project works).

```bash
npm ci
cp .env.example .env.local      # fill DATABASE_URL, BETTER_AUTH_SECRET (command inside)
npm run db:migrate              # creates the tables
npm run dev                     # http://localhost:3000
```

Optional demo account with 30 days of simulated history: set `DEMO_EMAIL` and `DEMO_PASSWORD` in `.env.local`, then `npm run seed:demo`.

## Checks
| Command | What it runs |
|---|---|
| `npm run check` | typecheck + lint + unit tests |
| `npm run test:db` | service tests against a real Postgres (needs `TEST_DATABASE_URL`, a separate branch: it wipes data) |
| `npm run test:e2e` | Playwright on desktop and phone viewports, against the test database |
| `node scripts/contrast.mjs` | WCAG contrast of every colour-token pair, light and dark |

Every push to `main` runs all of the above in GitHub Actions, then migrates the production database and deploys to Vercel; a failing test stops the release ([MD/deployment.md](MD/deployment.md)).

## Project layout
```
src/app/            pages (login, queues, queue screen, dashboard) + api/ route handlers
src/server/         auth, queue-service (all rules + locking), analytics-service
src/lib/            pure logic shared by client and server (estimates, formatting, optimistic updates)
src/db/             Drizzle schema + client · drizzle/ SQL migrations
tests/unit|db|e2e   pure logic · real Postgres · real browser
MD/                 project memory: research, decisions, API, design system, tasks
```

## Known gaps
- No password reset (no email service); no customer-facing display board; one server per queue.
- Auth rate limiting is in-memory per server instance.
