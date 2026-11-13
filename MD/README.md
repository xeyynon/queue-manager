# MD/ - project knowledge

One topic per file. Code lives in `src/`. The root `CLAUDE.md` is the brief for AI agents; [QueueManager_MASTER.md](QueueManager_MASTER.md) is the master.
When documents disagree, trust the code first and `QueueManager_MASTER.md` second.

## How to use these files
- **Start at the MASTER**, then `tasks.md` / `poa.md`, the newest `session_handover_*.md`, `rules.md`.
- **Update the doc in the same commit as the change.**
- **Versioning:** user-visible changes ship as builds, everything else as InBuls ([version_control.md](version_control.md)).
- **Facts and measurements carry a date and a source.** Never write a number you haven't measured; label estimates.
- **No secrets, client names or real personal data anywhere.** This folder is public (DEC-012).

## Which file gets what
| You learned... | Write it in |
|---|---|
| A choice between options, and why | [decisions.md](decisions.md) |
| Something that didn't work | [tried_and_failed.md](tried_and_failed.md) |
| Something proven to work | [tried_and_implemented.md](tried_and_implemented.md) |
| A bug / a fix with proof | [bugs.md](bugs.md) / [bugfixed.md](bugfixed.md) |
| A task or plan step | [tasks.md](tasks.md) / [poa.md](poa.md) |
| A question only the user/client can answer | [open_questions.md](open_questions.md) |
| An outside fact (docs, vendor, paper) | [external_research.md](external_research.md) |
| A risk | [pain.md](pain.md) |
| A working rule or rejected design | [rules.md](rules.md) |

## Index
### Start here
- [QueueManager_MASTER.md](QueueManager_MASTER.md): master reference. Current
- [intent.md](intent.md) · [prd.md](prd.md) · [open_questions.md](open_questions.md)

### Plans
- [tasks.md](tasks.md) · [poa.md](poa.md)

### Design and architecture
- [system_design_and_boundary.md](system_design_and_boundary.md): layout, data flow, trust boundaries. Current
- [api.md](api.md): every route, body, error. Current
- [design_system.md](design_system.md): tokens, type, contrast results. Current
- [ux_audit/](ux_audit/README.md): dated screenshot sets of every screen. Current

### Registers and logs
- [decisions.md](decisions.md) · [bugs.md](bugs.md) · [bugfixed.md](bugfixed.md) · [tried_and_failed.md](tried_and_failed.md) · [tried_and_implemented.md](tried_and_implemented.md) · [pain.md](pain.md) · [rules.md](rules.md) · [cost.md](cost.md)

### Research
- [research_and_decision_log.md](research_and_decision_log.md): Phase 1 research + stack validation + UI plan (2026-11-13), with all sources. Current (§6 "Next steps" is superseded by tasks.md)
- [external_research.md](external_research.md)

### Process
- [version_control.md](version_control.md) · [builds/](builds/) · [session_handover_2026-11-14.md](session_handover_2026-11-14.md)

### Private (gitignored)
- (none)
