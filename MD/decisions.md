# Decisions

Newest at the bottom. Never rewrite an entry: supersede it with a new one that names the old one.
Latest: DEC-028

## DEC-001 · Stack from the research phase (2026-11-13)
Status: accepted
Decision: Next.js (TS) · PostgreSQL on Neon · Drizzle · Better Auth · Tailwind · Recharts · Vitest + Playwright · Vercel.
Why: see [research_and_decision_log.md](research_and_decision_log.md) §4. Postgres row locks for "Serve next"; Drizzle has native `.for('update')` (Prisma doesn't); Auth.js is in maintenance under Better Auth; Vercel + Neon avoid Render's ~50 s cold start.
Rejected: MongoDB, SQLite, Prisma, Auth.js, Astro, React+Express, Render.
Chosen by: Claude (user delegated decisions, asked for sourced reasoning).

## DEC-002 · Keep the research stack over the playbook defaults (2026-11-14)
Status: accepted
Decision: Next.js + Tailwind + Recharts instead of the playbook's React+Vite, plain CSS and hand-written SVG charts.
Why: one deployable on Vercel (pages + API routes), and the stack was validated in the research phase. Tailwind is used fully (no inline style objects, no hybrid CSS) as the playbook requires when Tailwind is chosen.
Does NOT claim: Tailwind is better than plain CSS in general.
Revisit when: a second project on this stack hurts.
Chosen by: Claude (logged as a playbook deviation).

## DEC-003 · No shadcn/ui; own atoms + native dialog/popover + Sonner (2026-11-14)
Status: accepted (narrows research §4.6)
Decision: Button/TextField/AppBar written in-repo on project tokens; `<dialog>` for modals, the Popover API for the menu, Sonner for undo toasts.
Why: the app needs only 2 overlays; native elements give focus trap/Esc/light-dismiss for free; avoids the "default shadcn look" the playbook bans and 5+ dependencies.
Revisit when: we need a combobox, date picker or complex menu.

## DEC-004 · Cache Components off (2026-11-14)
Decision: `cacheComponents` removed from next.config (the scaffold turned it on).
Why: every screen is per-user live data; there is no static shell to prerender, and the flag forces Suspense around every session read. Pages call `headers()` first so they are dynamic and `next build` needs no database.

## DEC-005 · Lock the queue row for every mutation; serve checks the expected token (2026-11-14)
Decision: add/move/serve/cancel/restore each run in one transaction that first does `SELECT … FROM queues WHERE id AND owner FOR UPDATE`. `serveNext` takes `expectedTokenId`; if the top token differs, it returns STALE and serves nobody.
Why: stronger and simpler than locking only the top token (research §3.6): it also serialises moves racing serves and the token/position counters. With `ORDER BY … LIMIT 1 FOR UPDATE` on tokens, Postgres can return zero rows after a lock wait; the queue lock avoids that edge. `expectedTokenId` turns "double-click" and "two tabs" into one serve.
Does NOT claim: high write throughput per queue (one manager per queue makes this irrelevant).
Verified by: `tests/db/queue-service.test.ts` (10 parallel serves → exactly 1; 8 serves on 5 tokens → 5 distinct) — **not run yet**.

## DEC-006 · Integer positions, swap via a negative slot; counters on the queue row (2026-11-14)
Decision: `tokens.position` unique per queue; move swaps with the nearest *waiting* neighbour (parking the mover on `-position` first because unique checks are per row). New tokens take `queues.next_position` / `next_token_no`. Cancelled tokens keep their position, so Undo returns them to the same place.
Why: research §3.5 (single manager, up/down buttons, no drag-drop → no fractional indexing).

## DEC-007 · Wait estimate rules (2026-11-14)
Decision: λ from the last ≤10 serves within 2 h; needs ≥3 serves, else "—". Position k waits (k−1)·interval + remainder of the current interval. Percentiles on the dashboard need ≥5 served.
Why: Little's Law (research §3.2) + honest data. Thresholds are judgement, not measured.
Revisit when: real usage shows estimates far off.

## DEC-008 · Token states: waiting → served | cancelled (2026-11-14)
Decision: no separate "completed" step; "Now serving" = most recently served token. Wait = served_at − created_at.
Why: matches the brief ("assign for service"); keeps the button count at one.
Not done: recall/no-show (P2).

## DEC-009 · Undo window 5 minutes on the server, 8 s toast (2026-11-14)
Why: research §5.2 rule 3 (undo over confirmation). The server window stops "undo" from resurrecting old tokens via the API.

## DEC-010 · Demo account with simulated history, labelled on every screen (2026-11-14)
Decision: `npm run seed:demo` creates DEMO_EMAIL with 3 queues and 30 days of seeded simulation (time-of-day arrival curve, exponential service, ~7% walk-outs, ~4% priority moves). The account's every screen shows "Sample data: … simulated". Login page offers "Fill in the demo login" only when DEMO_* env vars are set.
Why: an evaluator should see a populated dashboard; the playbook requires demo data to be labelled, never passed off as real.

## DEC-011 · Dev DB on Neon; tests on a separate Neon branch (2026-11-14)
Decision: DATABASE_URL = Neon dev; TEST_DATABASE_URL = separate branch used by DB and E2E tests; tests refuse to run if both are equal (they truncate tables).
Chosen by: user (Neon for dev instead of Docker Postgres).

## DEC-012 · MD/ is committed to the public repo (2026-11-14)
Chosen by: user. Nothing private goes in MD/.

## DEC-013 · Queue list shows waiting / longest wait / now serving instead of average wait (2026-11-14)
Supersedes research §5.1 "card per queue (name, number waiting, average wait)" for that one field.
Why: "average wait today" depends on the viewer's time zone and duplicates the dashboard; longest current wait is live and actionable. Rows, not three equal cards (playbook anti-pattern).

## DEC-014 · Login is a two-column page, not a centred floating card (2026-11-14)
Supersedes research §5.1 "simple and centered". Why: the playbook bans the centred floating auth card as an AI-look tell.

## DEC-015 · Chart colours: blue (arrivals, queue length) + orange (served) (2026-11-14)
Why: validated with the dataviz `validate_palette.js` against #fff and #1b1c23 (all checks pass, CVD ΔE ≥ 24.7). The indigo accent stays reserved for actions/focus.

## DEC-016 · Fixed 15-minute "long wait" threshold (2026-11-14)
Why: simple, explainable, shown as colour + the words "long wait". Revisit when: per-queue targets are requested.

## DEC-017 · Local Docker Postgres for verification until Neon is set up (2026-11-14)
Decision: container `qm-postgres` (Postgres 17, port 54329) with databases `qm_dev` and `qm_test`; `.env.local` points at it. Neon remains the dev/prod target (DEC-011).
Chosen by: user ("throwaway Docker DB now").
Revisit when: Neon strings arrive: swap `.env.local`, run `npm run db:migrate` and `npm run seed:demo` there.

## DEC-018 · "Add token" ignores presses while an add is in flight (2026-11-14)
Why: a double-click on Add token must not issue two tokens (same class of bug as double-serve). Pressing `A` twice deliberately works once the first token appears (~100 ms locally). Tested: e2e "double-clicking Add token issues one token, not two".

## DEC-019 · E2E server turns the auth rate limit off (2026-11-14)
Decision: `E2E_DISABLE_RATE_LIMIT=1` is set only by the web server in `playwright.config.ts`. Why: Better Auth limits sign-in/sign-up to 3 per 10 s per IP and the suite signs up a fresh manager per test. Production keeps it on.

## DEC-020 · 24-hour times everywhere (2026-11-14)
Why: matches the dashboard hour buckets ("09:00–10:00") and keeps timestamps from wrapping ("AM" on its own line, B-04).

## DEC-021 · Durations use tabular Inter; monospace only for token numbers and clocks (2026-11-14)
Why: "14 min" in mono next to Inter text looked broken (B-05); tabular figures still stop digits jittering.

## DEC-022 · Neon project, branches and region (2026-11-14)
Decision: Neon project `queue-manager` (curly-dust-57177870) in org SURYA (org-twilight-dew-78709812), region `aws-ap-southeast-1` (Singapore). Branches: `main` = production (Vercel), `dev` = local `DATABASE_URL`, `test` = `TEST_DATABASE_URL` (tests truncate it). Pooled URLs everywhere. Folder linked with `neon link` (`.neon`, gitignored); `--no-env-pull` so existing `.env.local` keys were kept.
Why: closest Neon region to India; branch-per-purpose as the Neon skill recommends; supersedes the local Docker DB of DEC-017 (container left running, unused).
Chosen by: user (personal org); region by Claude.

## DEC-023 · Vercel functions in Singapore, framework pinned (2026-11-14)
Decision: `vercel.json` sets `"framework": "nextjs"` and `"regions": ["sin1"]`. Why: next to the Neon region; the project was created with `vercel project add`, which doesn't detect the framework (first deploy failed looking for `public/`).

## DEC-024 · Auth base URL falls back to Vercel's production domain (2026-11-14)
Decision: `baseURL = BETTER_AUTH_URL ?? https://$VERCEL_PROJECT_PRODUCTION_URL`. Why: no redeploy needed to learn the domain. Preview deployments are not supported for sign-in (different origin).

## DEC-025 · Clock times render after hydration (2026-11-14)
Decision: all clock times in server-rendered components use `<LocalTime>`; placeholder "--:--" during SSR. Why: B-08. The server cannot know the viewer's zone.

## DEC-026 · Double-click protection by time window, not by in-flight lock (2026-11-14)
Supersedes DEC-018. Decision: a press within 600 ms of the previous one is the same press; anything later is queued. Why: B-10 (in-flight locks swallowed deliberate presses once real latency existed). Server-side expectedTokenId keeps "never serve two" independent of the client.

## DEC-027 · Neon agent tooling in the repo (2026-11-14)
Decision: project-level Neon MCP server via OAuth (`.mcp.json`, URL only, no key) and project-level skills `neon` + `neon-postgres` in `.claude/skills/` (locked in `skills-lock.json`). Installed with `neon` CLI 9.5.0 (global npm `neonctl`, user-approved) and the `skills` installer 1.8.1 run once under a temporary Node 22 (`npx -p node@22`); system Node stays 20.
Why: user asked to follow Neon's skill. Only the skills relevant to this app (Postgres) were installed; Neon Auth/Functions/Storage are not used (Better Auth stays, per the skill's own guidance).

## DEC-028 · Deploy from the GitHub Actions pipeline on every push to main (2026-11-14)
Decision: `.github/workflows/ci.yml` runs check (typecheck, lint, unit, contrast, build) → test (DB tests + Playwright E2E on Neon `test`) → deploy (drizzle migrate on Neon `main`, then `vercel pull/build/deploy --prebuilt --prod`, then a smoke test). Pull requests stop after test. One run at a time (shared `test` branch).
Why: the user wants every push to update the live site; deploying from the pipeline means a failing test blocks the release and migrations run before new code goes live. Vercel's own Git integration was rejected: it would deploy even when tests fail and does not migrate the database.
Secrets (repo): TEST_DATABASE_URL, PROD_DATABASE_URL, VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN, set by the owner with `scripts/setup-github-secrets.sh` (Claude may not send DB credentials to GitHub).
Does NOT claim: zero-downtime for destructive migrations; keep migrations backward-compatible.
Revisit when: PR preview deployments are wanted (needs a Neon branch per PR and a preview auth URL).
