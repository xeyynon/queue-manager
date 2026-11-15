# Version control

## Builds (user-visible)
- Numbers start at **1000**, tag `build-N` (the tag is the source of truth; never in commit titles; never moved or renumbered).
- Report `MD/builds/build-N.md`: hand-written part (what, why, verified, not verified, next) written once; "Files changed" regenerated from git.
- Batch about **10 fixes** per build, even an urgent one.

## InBuls (internal: docs, MD, scripts, tests, tooling, unswitched providers, merges)
- Commit title `InBulNN: <plain words>` + tag `InBulNN`; no report, no CHANGELOG entry.

## Commit flow
1. Stage the change files by name (never `git add -A`).
2. Build: `node scripts/changelog.mjs --pending "<title>" "<summary>" --why "..." --verified "..." --next "..."`, then stage `MD/builds CHANGELOG.md`.
3. Commit with the same plain-words title and a real body (what, why, verified). Only the owner's name; no co-author lines.
4. `node scripts/changelog.mjs --tag` (InBul: `--next-internal` for the id).
5. Push only when told: `git push origin main --tags`.

## Branches
main only for now (single developer). Parallel sessions use separate worktrees. Exception at the owner's request: `ux-audit-fixes` (2026-11-15); tag the build when it reaches main, not on the branch.

## This repo
- `scripts/changelog.mjs` from the playbook flow is **not set up yet**; until it is, write `MD/builds/build-N.md` by hand and tag with `git tag build-N`.
- Commits only when the user asks; messages carry only the owner's name (no co-author lines).

Next free: build-1000 · InBul01 (re-check before using)
