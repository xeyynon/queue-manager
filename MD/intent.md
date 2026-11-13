# intent.md: why this project exists

## The problem
Walk-in counters (clinics, banks, offices, restaurants) run lines with paper registers and shouting names. People argue about who came first, nobody knows how long the wait is, and the manager can't see when it gets busy. The assignment asks for a digital token system for the person running the line, plus analytics.

## Users
| Who | Device | Where | What they need | What goes wrong for them |
|---|---|---|---|---|
| Queue manager | Desktop/laptop at the counter; sometimes phone/tablet | Busy front desk, people waiting in front of them | Add a token in one action, serve next in one click, fix mistakes fast | Double-clicks, misclicks, losing track of order, being asked "how long?" with no answer |
| Evaluator | Desktop browser | Reviewing the submission | See all 8 requirements work, no bugs, a considered UI, clean code | Slow first load, empty dashboard, unclear demo path |

## Principles
1. **Honest data:** show only what the data supports. No estimate without enough serves; "—" with a reason instead.
2. **Can't serve twice:** concurrency safety is designed in (locks + expected-token check), not hoped for.
3. **Calm and hard to get wrong:** one big primary action, small secondary actions, undo instead of confirmations for reversible actions.
4. **Fairness is visible:** every reorder is badged and logged.
5. **Every claim is tested:** each requirement has DB tests and an E2E path.

## Non-goals
- Customer-facing kiosk/display, SMS or app notifications.
- Multiple servers/counters per queue, staff roles and permissions.
- Appointment booking, payments, multi-language UI (English only for now).
