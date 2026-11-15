# UX audit screenshots

`node scripts/screenshots.mjs [baseUrl] [outDir]` (app running, demo seeded) writes one PNG per screen × width (390, 820, 1280, 1920) × theme (light, dark) and prints console errors and horizontal overflow.

- [2026-11-15-compare/](2026-11-15-compare/): before/after side by side for 8 screens, both taken on the same dev data minutes apart (before = commit e975158).
- [2026-11-15-audit.md](2026-11-15-audit.md): UI/UX audit of every screen (14 findings, all fixed) with proof; screenshots after the fixes in [2026-11-15/](2026-11-15/) (dev data a day old, so waits read 31 h).
- [2026-11-14/](2026-11-14/): after the B-01…B-07 fixes. Light + dark: no console errors, no horizontal overflow. Full-page shots draw the phone's docked "Serve next" bar mid-page; on a real phone it stays at the bottom.
