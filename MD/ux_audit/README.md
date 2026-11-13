# UX audit screenshots

`node scripts/screenshots.mjs [baseUrl] [outDir]` (app running, demo seeded) writes one PNG per screen × width (390, 820, 1280, 1920) × theme (light, dark) and prints console errors and horizontal overflow.

- [2026-11-14/](2026-11-14/): after the B-01…B-07 fixes. Light + dark: no console errors, no horizontal overflow. Full-page shots draw the phone's docked "Serve next" bar mid-page; on a real phone it stays at the bottom.
