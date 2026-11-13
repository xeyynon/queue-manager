# Rules

Project rules on top of the playbook. If one has to break, stop and ask first. Change a rule only via a DEC entry.

- **R-1 · Every queue mutation goes through `queue-service.ts` and locks the queue row first.** Why: DEC-005; one place to get concurrency right.
- **R-2 · Every service function takes `ownerId` and filters by it.** Someone else's queue is indistinguishable from a missing one (NOT_FOUND). Why: no data leak between managers.
- **R-3 · No colour literals outside `globals.css`.** Enforced by `tests/unit/no-literal-colours.test.ts` (also bans Tailwind palette classes like `bg-blue-500`).
- **R-4 · Dark-mode token blocks stay identical.** Enforced by `tests/unit/tokens.test.ts`; contrast by `node scripts/contrast.mjs`.
- **R-5 · No number without enough data.** Estimates/percentiles show "—" plus the reason below their thresholds (DEC-007).
- **R-6 · Status is never colour alone.** Long wait = colour + clock icon + "long wait".
- **R-7 · Tests that write to a DB use TEST_DATABASE_URL only** and refuse to run if it equals DATABASE_URL.

## Rejected designs (removed everywhere; grep before merge)
- Centred floating auth card — playbook ban. Check: login page uses a two-column grid.
- Coloured side stripes. Check: `grep -rnE "border-left|borderLeft|border-inline-start|border-l-" src`
- Default shadcn look — not used (DEC-003).
