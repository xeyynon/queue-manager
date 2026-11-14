# Bugs fixed

Only with proof: a test that failed before the fix, or a saved run. Never edit an old line to hide a regression; reopen the bug.

| Date | ID | Fix | Test: <path> :: <name> | Commit | Build |
|---|---|---|---|---|---|
| 2026-11-14 | B-01 | Qualified outer `"queues"."id"` in list subqueries | `tests/db/queue-service.test.ts` :: list shows each queue's own waiting count, longest wait and now-serving (B-01) — generated SQL showed `t.queue_id = "id"` before the fix | uncommitted | — |
| 2026-11-14 | B-02…B-07 | Layout, time format, chart axis and seed fixes | `scripts/screenshots.mjs` run, `MD/ux_audit/2026-11-14/` (42 shots, no console errors, no horizontal overflow in light or dark) | uncommitted | — |
| 2026-11-14 | B-08 | `LocalTime` + guard test + UTC/IST E2E | `tests/unit/no-ssr-time-format.test.ts`; production screenshot run showed React error 418 before, clean after | uncommitted | — |
| 2026-11-14 | B-09…B-11 | beforeunload guard, press guard, toast offset | e2e full flow failed on desktop and phone against Neon before; 13/13 pass twice after | uncommitted | — |
