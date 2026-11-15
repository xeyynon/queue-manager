# Queue Manager

A token queue system for walk-in counters such as a clinic, bank or office.

A manager can:
- create named queues and issue tokens
- reorder tokens and serve the top one with one click
- cancel a token, with undo
- read wait-time analytics

## Try it
**Live app:** https://queue-manager-bice.vercel.app

| Option | How |
|---|---|
| Demo account | Click **Sign in to the demo account** on the sign-in page |
| Your own account | Click **Create account**; it starts empty |

The demo holds 30 days of **simulated** data, and every screen says so.

<img src="docs/screenshots/queue-1280-light.png" alt="Queue screen: add a token, the waiting list with live wait timers and estimates, Now serving and the one-click Serve next button">

## Screenshots
- Taken from the production build on 2026-11-15, signed in as the demo account (hence the "Sample data" strip).
- Light and dark follow the system setting; switch them in the menu.
- Phone shots are full-page, so the docked **Serve next** bar appears mid-page. On a real phone it stays at the bottom.

### Desktop (1280 px)
| | Light | Dark |
|---|---|---|
| **Sign in** | <img src="docs/screenshots/login-1280-light.png" alt="Sign-in page, light"> | <img src="docs/screenshots/login-1280-dark.png" alt="Sign-in page, dark"> |
| **Your queues** | <img src="docs/screenshots/queues-1280-light.png" alt="Queue list, light"> | <img src="docs/screenshots/queues-1280-dark.png" alt="Queue list, dark"> |
| **Queue screen** | <img src="docs/screenshots/queue-1280-light.png" alt="Queue screen, light"> | <img src="docs/screenshots/queue-1280-dark.png" alt="Queue screen, dark"> |
| **Dashboard · today** | <img src="docs/screenshots/dashboard-today-1280-light.png" alt="Dashboard today, light"> | <img src="docs/screenshots/dashboard-today-1280-dark.png" alt="Dashboard today, dark"> |
| **Dashboard · 7 days** | <img src="docs/screenshots/dashboard-7d-1280-light.png" alt="Dashboard 7 days, light"> | <img src="docs/screenshots/dashboard-7d-1280-dark.png" alt="Dashboard 7 days, dark"> |
| **Dashboard · 30 days** | <img src="docs/screenshots/dashboard-30d-1280-light.png" alt="Dashboard 30 days, light"> | <img src="docs/screenshots/dashboard-30d-1280-dark.png" alt="Dashboard 30 days, dark"> |

### Phone (390 px)
| Your queues | Queue screen | Dashboard · today |
|---|---|---|
| <img src="docs/screenshots/queues-390-light.png" alt="Queue list on a phone, light"> | <img src="docs/screenshots/queue-390-light.png" alt="Queue screen on a phone, light"> | <img src="docs/screenshots/dashboard-today-390-light.png" alt="Dashboard on a phone, light"> |
| <img src="docs/screenshots/queues-390-dark.png" alt="Queue list on a phone, dark"> | <img src="docs/screenshots/queue-390-dark.png" alt="Queue screen on a phone, dark"> | <img src="docs/screenshots/dashboard-today-390-dark.png" alt="Dashboard on a phone, dark"> |

<details>
<summary><b>More: phone dashboards (7 and 30 days), tablet (820 px) and wide (1920 px)</b></summary>

#### Phone (390 px)
| Dashboard · 7 days | Dashboard · 30 days |
|---|---|
| <img src="docs/screenshots/dashboard-7d-390-light.png" alt="Dashboard 7 days on a phone, light" width="260"> <img src="docs/screenshots/dashboard-7d-390-dark.png" alt="Dashboard 7 days on a phone, dark" width="260"> | <img src="docs/screenshots/dashboard-30d-390-light.png" alt="Dashboard 30 days on a phone, light" width="260"> <img src="docs/screenshots/dashboard-30d-390-dark.png" alt="Dashboard 30 days on a phone, dark" width="260"> |

#### Tablet (820 px)
| | Light | Dark |
|---|---|---|
| **Your queues** | <img src="docs/screenshots/queues-820-light.png" alt="Queue list on a tablet, light"> | <img src="docs/screenshots/queues-820-dark.png" alt="Queue list on a tablet, dark"> |
| **Queue screen** | <img src="docs/screenshots/queue-820-light.png" alt="Queue screen on a tablet, light"> | <img src="docs/screenshots/queue-820-dark.png" alt="Queue screen on a tablet, dark"> |
| **Dashboard · today** | <img src="docs/screenshots/dashboard-today-820-light.png" alt="Dashboard today on a tablet, light"> | <img src="docs/screenshots/dashboard-today-820-dark.png" alt="Dashboard today on a tablet, dark"> |
| **Dashboard · 7 days** | <img src="docs/screenshots/dashboard-7d-820-light.png" alt="Dashboard 7 days on a tablet, light"> | <img src="docs/screenshots/dashboard-7d-820-dark.png" alt="Dashboard 7 days on a tablet, dark"> |
| **Dashboard · 30 days** | <img src="docs/screenshots/dashboard-30d-820-light.png" alt="Dashboard 30 days on a tablet, light"> | <img src="docs/screenshots/dashboard-30d-820-dark.png" alt="Dashboard 30 days on a tablet, dark"> |

#### Wide (1920 px)
| | Light | Dark |
|---|---|---|
| **Your queues** | <img src="docs/screenshots/queues-1920-light.png" alt="Queue list, wide, light"> | <img src="docs/screenshots/queues-1920-dark.png" alt="Queue list, wide, dark"> |
| **Queue screen** | <img src="docs/screenshots/queue-1920-light.png" alt="Queue screen, wide, light"> | <img src="docs/screenshots/queue-1920-dark.png" alt="Queue screen, wide, dark"> |
| **Dashboard · today** | <img src="docs/screenshots/dashboard-today-1920-light.png" alt="Dashboard today, wide, light"> | <img src="docs/screenshots/dashboard-today-1920-dark.png" alt="Dashboard today, wide, dark"> |
| **Dashboard · 7 days** | <img src="docs/screenshots/dashboard-7d-1920-light.png" alt="Dashboard 7 days, wide, light"> | <img src="docs/screenshots/dashboard-7d-1920-dark.png" alt="Dashboard 7 days, wide, dark"> |
| **Dashboard · 30 days** | <img src="docs/screenshots/dashboard-30d-1920-light.png" alt="Dashboard 30 days, wide, light"> | <img src="docs/screenshots/dashboard-30d-1920-dark.png" alt="Dashboard 30 days, wide, dark"> |

</details>

Retake them all with `npm run build && npx next start`, then `node scripts/screenshots.mjs http://localhost:3000 docs/screenshots` (needs the demo seeded).

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
- **No double serving.**
  - Every change to a queue runs in one transaction that locks the queue row (`SELECT … FOR UPDATE`).
  - "Serve next" sends the token the manager saw at the top. If the queue changed, nobody is served and the screen refreshes.
  - Tested with 10 simultaneous serve requests.
- **Ownership on every query.** Another manager's queue looks exactly like a missing one (404).
- **Honest numbers.** Estimated waits use Little's Law on the recent serving pace and show "—" until there are 3 serves in the last 2 hours; percentiles need 5 served.
- **Audit trail.** Every add, move, serve, cancel and undo is logged with who and when, and shown on the queue screen.
- **Feels instant.** Optimistic updates with rollback; requests sent in click order; undo instead of "are you sure?".
- **Accessible and readable.**
  - Status is never colour alone: a long wait shows a clock icon, the words "long wait" and colour.
  - Every colour pair is measured against WCAG in both themes, including form-field edges.
  - Keyboard focus stays in the list after a move or cancel (E2E-tested).
  - Touch targets are 44 px on phones, and every chart has a "Show as table" view.

## Stack
| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Recharts |
| Data | PostgreSQL on Neon, Drizzle ORM, Zod |
| Auth | Better Auth (email + password) |
| Tests | Vitest, Playwright |
| Hosting | Vercel, deployed from GitHub Actions |

Each choice was compared against alternatives first. Two examples:
- **Drizzle over Prisma:** Drizzle supports `SELECT … FOR UPDATE` natively.
- **Better Auth over Auth.js:** Auth.js is now in maintenance mode.

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

Every push to `main` runs all of the above in GitHub Actions, then migrates the production database and deploys to Vercel; a failing test stops the release.

## Project layout
```
src/app/            pages (login, queues, queue screen, dashboard) + api/ route handlers
src/server/         auth, queue-service (all rules + locking), analytics-service
src/lib/            pure logic shared by client and server (estimates, formatting, optimistic updates)
src/db/             Drizzle schema + client · drizzle/ SQL migrations
tests/unit|db|e2e   pure logic · real Postgres · real browser
```

## Known gaps
- No password reset (no email service); no customer-facing display board; one server per queue.
- Auth rate limiting is in-memory per server instance.
