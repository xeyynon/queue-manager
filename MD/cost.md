# Cost register

What this project pays for, the guardrails in place, the switches that trade cost for speed, and a dated log of the bill. Playbook rules: `~/.claude/skills/playbook/modules/cost.md`.

## Providers and billing units
| Provider | Used for | Billed by (unit) | Plan / credit | Alert set? | Hard cap set? | Key scoped to this app? |
|---|---|---|---|---|---|---|
| Neon | Postgres | CU-hours (100/project/month free), storage (1 GB/project free) | Free, no card | [ ] | n/a (free plan stops at quota) | [x] own project |
| Vercel | app hosting | function invocations / GB-hours, bandwidth | Hobby (free) | [ ] | n/a | n/a |

## Day-one checklist
- [x] Billing unit written for every provider (above)
- [ ] Alerts at Neon/Vercel (free plans: check usage pages after deploy)
- [x] No paid APIs
- [x] Polling only while the tab is visible (`usePolling`)
- [x] Idle DB pool connections close after 10 s (`idleTimeoutMillis`)
- [ ] Vercel deployment protection checked (evaluator can open the URL)

## Switches (cost vs speed)
| Switch | Where it lives | Current | How to flip (e.g. demo day) |
|---|---|---|---|
| Neon scale-to-zero | Neon console → compute settings | default (on) | open the app a minute before the demo to warm it |

## Bill log
| Period | Total | Biggest line (share) | Action taken | Result |
|---|---|---|---|---|
