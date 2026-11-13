# Tried and implemented

Proven approaches in the code. Check here before building something new.

| ID | When | What | Verified how | **Not verified** |
|---|---|---|---|---|
| TI-1 | 2026-11-14 | Hydration-safe live clock: one shared 1 s ticker via `useSyncExternalStore`, server snapshot = server time (`src/hooks/useNow.ts`) | typecheck + lint (react-hooks rules) + build | in a browser |
| TI-2 | 2026-11-14 | Theme toggle without flash: inline head script sets `data-theme`; React reads it through a tiny external store (`AppBar.tsx`) | build | in a browser |
| TI-3 | 2026-11-14 | Pages call `headers()` before touching the DB so `next build` never needs DATABASE_URL | `npm run build` passes with no env | — |
| TI-4 | 2026-11-14 | Colour-literal guard test + token-block parity test + contrast script | `npm test`, `node scripts/contrast.mjs` | — |
