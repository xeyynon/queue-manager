# PRD: requirements and what "done" means

Brief (verbatim) is in [research_and_decision_log.md](research_and_decision_log.md) §1.

## Must have (P0)
| # | Requirement | Done when | Status |
|---|---|---|---|
| R1 | Manager can log in and create queues | Sign up / sign in works; signed-out users are redirected; queue created from the Queues page | code + tests written; not run on DB |
| R2 | Each queue has a name | Name required, 1-60 chars, whitespace collapsed, unique per manager (case-insensitive); rename available | code + tests written |
| R3 | Add persons/tokens; a token is created | "Add token" (button or `A`) creates #N, optional name/note; numbers unique per queue, never reused | code + tests written (incl. 20 parallel adds) |
| R4 | Queue shows the list of waiting tokens | Ordered list with position, number, name, live wait, estimate, moved badge | code written |
| R5 | Move tokens up and down | Up/down buttons swap neighbours; edges disabled in UI and no-op on server; logged | code + tests written |
| R6 | Assign the top token for service with one click | "Serve next #N" (or `S`); double-click/second tab can't serve two | code + tests written (10 parallel serves) |
| R7 | Cancel a token | Cancel is immediate with an Undo toast; undo restores the same place within 5 min | code + tests written |
| R8 | Dashboard: wait times, queue-length trends | 4 headline figures (waiting now, avg + median, p90, served + cancellations), queue-length line, arrivals vs served bars, busiest hour; Today / 7 / 30 days; per queue or all | code + tests written |

## Should have (P1)
- Demo account with 30 days of simulated history, clearly labelled (for evaluators).
- Activity/audit log on the queue screen.
- Keyboard shortcuts, dark mode, responsive phone layout.
- Deployed on Vercel + Neon with README, screenshots, CI.

## Could have (P2)
- Recall / "return to queue" for a served token; "no-show" status separate from cancel.
- Customer display board page (read-only, big numbers).
- Export dashboard as CSV.

## Cut first if time runs out
- P2 items, then the 30-day range, then the demo seed.

## Out of scope
- See [intent.md](intent.md) non-goals.
