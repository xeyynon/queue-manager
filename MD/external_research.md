# External research

Outside facts (vendor docs, APIs, papers, datasets), each with its source and the date it was read. Re-read the live page before relying on a fact in code.

**Last verified:** 2026-11-14

The research phase (queueing theory, Maister, UI rules, stack comparison, Neon/Render limits) with all sources is in [research_and_decision_log.md](research_and_decision_log.md) §3-§7 (read 2026-11-13).

| Date read | Fact | Source | Used in |
|---|---|---|---|
| 2026-11-14 | Next.js 16 renamed Middleware to Proxy; `create-next-app` 16.4 enables `cacheComponents` by default; with it on, `cookies()` outside `<Suspense>` is a build error | `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, `02-guides/authentication-with-cache-components.md` | DEC-004 |
| 2026-11-14 | Better Auth 1.7.23 core tables: user, session, account, verification and their fields | `node_modules/@better-auth/core/dist/db/get-tables.mjs` | `src/db/schema.ts` |
| 2026-11-14 | Better Auth error codes: INVALID_EMAIL_OR_PASSWORD, USER_ALREADY_EXISTS(_USE_ANOTHER_EMAIL), PASSWORD_TOO_SHORT/LONG, INVALID_EMAIL | `node_modules/@better-auth/core/dist/error/` | `src/app/login/LoginForm.tsx` |
| 2026-11-14 | Route handler `params` is a Promise in Next 15+/16 | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` | `src/app/api/**` |
| 2026-11-14 | Chart palette #2a78d6/#eb6834 (light) and #3987e5/#d95926 (dark) pass lightness, chroma, CVD (ΔE ≥ 24.7), normal-vision and contrast checks | dataviz skill `scripts/validate_palette.js`, run against #ffffff and #1b1c23 | DEC-015 |
