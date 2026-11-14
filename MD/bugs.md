# Bugs

Status: open-unverified · open · fixed-uncommitted · fixed (build) · won't fix (why).
Reviewer/agent findings start as open-unverified until checked in code.

| ID | Severity | Status | Scenario (repro) | Suggested fix | Verified by |
|---|---|---|---|---|---|
| B-01 | high | fixed-uncommitted | Queue list showed "0 waiting / none served yet" for every queue. Drizzle rendered `${queues.id}` as a bare `"id"` inside correlated subqueries, which Postgres resolved to `tokens.id`. | Reference the outer row as `"queues"."id"` (`OUTER_QUEUE_ID`) | `tests/db › list shows each queue's own waiting count… (B-01)` |
| B-02 | medium | fixed-uncommitted | Waiting rows on desktop: ↑ ↓ buttons drawn over the position number, ticket tile stretched. Action cell kept `row-start-1` with an auto column, so the grid put it in column 1. | Place it explicitly at `sm:col-start-6` | screenshot `MD/ux_audit/2026-11-14/queue-1280-*.png` |
| B-03 | low | fixed-uncommitted | Phone rows: "long wait" and "est. < 1 min" wrapped to extra lines. | Info line starts under the ticket, `whitespace-nowrap` | screenshot `queue-390-*.png` |
| B-04 | low | fixed-uncommitted | Activity log: 12-hour "AM" wrapped onto its own line; times inconsistent with the dashboard's 24-hour labels. | `hourCycle: "h23"` everywhere | screenshots |
| B-05 | low | fixed-uncommitted | Durations ("4 min") set "min" in the monospace font next to Inter text. | `.tnum` (tabular digits, UI font) for durations/figures; mono only for tokens and clocks | screenshots |
| B-06 | medium | fixed-uncommitted | Demo seed: queue-length chart sat at 1 overnight. Priority-move events were stamped 1 min after arrival with the arrival-time waiting count. | Stamp the move 1 ms after arrival | dashboard-7d screenshot (seed only; the app records counts at the real time) |
| B-07 | low | fixed-uncommitted | Dashboard 7-day axis repeated each date twice; 30-day view used 6-h buckets (noisy) and weekday ticks (ambiguous). | One tick per local midnight; 30 days = daily peaks with date ticks | dashboard screenshots |
| B-08 | high | fixed-uncommitted | Production only: React hydration error 418 on the queue screen. Server (Vercel, UTC) formatted clock times during SSR; the browser (IST) rendered different text, so "called …" and the activity log could show UTC. | `<LocalTime>` renders times only after hydration; guard test bans `toLocale*` in SSR components; E2E runs server in UTC + browser in IST and fails on console errors | `tests/unit/no-ssr-time-format.test.ts`, e2e afterEach console check, production screenshot run |
| B-09 | medium | fixed-uncommitted | Optimistic serve showed "Now serving #3", but reloading before the request reached the server dropped it (seen with Neon latency). | `beforeunload` warning while a change is still being sent | e2e full flow |
| B-10 | high | fixed-uncommitted | A deliberate second "Serve next" (or "Add token") while the previous request was in flight was silently ignored; with real network latency managers would lose clicks. | Press guard: only presses within 600 ms count as one (double-click); later presses are queued in order; server still checks expectedTokenId | `tests/unit/press-guard.test.ts`, e2e double-click + full flow |
| B-11 | medium | fixed-uncommitted | Phones/tablets: toasts covered the docked "Serve next" bar, so taps hit the toast. | Toasts offset 104 px from the bottom | e2e phone full flow |
