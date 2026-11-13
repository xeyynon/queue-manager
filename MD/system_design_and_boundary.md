# System design and boundaries

## Shape
```
Browser (React client components)
  │  fetch JSON (same origin), polls every 5 s (queue) / 10 s (list) / 30 s (dashboard) while the tab is visible
  ▼
Next.js on Vercel
  ├─ pages (server components): read session → redirect or render with initial data
  ├─ /api/auth/*         Better Auth (email + password, cookie session)
  ├─ /api/queues/...     thin route handlers → server/queue-service.ts
  └─ /api/analytics      → server/analytics-service.ts
        │ pg Pool (max 5) via Drizzle
        ▼
Neon Postgres: user/session/account/verification · queues · tokens · queue_events
```

## Code layout
| Path | Holds |
|---|---|
| `src/db/` | Drizzle schema + pooled client |
| `src/server/` | auth, services (all business rules + locking), HTTP helpers, errors |
| `src/lib/` | pure, tested logic shared by client and server (estimate, format, series, optimistic, validation, types) |
| `src/app/` | routes: pages + their client components, `api/` handlers |
| `src/components/` | shared atoms (Button, TextField, AppBar, Icons) |
| `src/hooks/` | useNow (shared ticker, hydration-safe), usePolling (visible-tab only) |
| `tests/unit` · `tests/db` · `tests/e2e` | pure logic · real Postgres · real browser |

## In scope
- R1-R8 from [prd.md](prd.md), single manager per account, one server per queue.

## Out of scope
- See [intent.md](intent.md) non-goals; P2 list in prd.md.

## Where data goes
| Data | Leaves this machine to | Kept where |
|---|---|---|
| Manager name, email, password hash, sessions | Neon (Postgres) | `user`, `account`, `session` |
| Queue names, token names/notes, timestamps, action log | Neon | `queues`, `tokens`, `queue_events` |
| Viewer time zone (for dashboard buckets) | our API only, per request | not stored |
| Fonts | downloaded at build time by next/font, served from our origin | build output |

## Trust boundaries
- **All request bodies and params are untrusted.** Zod validates bodies; ids must be UUIDs (else NOT_FOUND before any query); names/labels trimmed and length-capped; time zone validated with `Intl.DateTimeFormat` and charset-checked, then passed as a bound parameter.
- **Authorisation:** every API route needs a session (`withUser`); every service query filters by `owner_id` (R-2).
- **SQL:** Drizzle parameterises everything; raw `sql\`\`` fragments only interpolate bound values or whitelisted literals (`hour`/`day`).
- **Auth endpoints** are rate-limited by Better Auth (30 req / 60 s, in-memory per instance).
- **Errors:** expected failures return `{error:{code,message}}` with a human message; unexpected ones log server-side and return a generic 500 (no stack traces to the client).
