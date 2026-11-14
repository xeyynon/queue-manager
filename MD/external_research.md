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
| 2026-11-14 | Neon agent skill: prefer CLI over MCP; project-level MCP via OAuth so no key lands in git; `neon link`/`checkout` pull env unless `--no-env-pull`; keep existing Better Auth / DATABASE_URL; services (Storage/Functions/AI Gateway/Realtime) only in us-east-1/2, eu-central-1, ap-southeast-1 | https://neon.com/.well-known/agent-skills/neon/SKILL.md, `.claude/skills/neon/SKILL.md` | DEC-022, DEC-027 |
| 2026-11-14 | `neon skills` needs Node ≥ 22.20 (it shells out to `skills@latest`); on Windows its `--metadata` JSON argument broke `npm exec` | observed (neon 9.5.0) | DEC-027 |
| 2026-11-14 | Better Auth rate-limits /sign-in and /sign-up to 3 requests per 10 s per IP by default | `node_modules/better-auth/dist/api/rate-limiter/index.mjs` | DEC-019 |
| 2026-11-14 | `vercel project add` + `vercel link` leave the framework preset empty → static build looking for `public/` | observed (Vercel CLI 60.1.3) | DEC-023 |
