# Pain: what can break and how badly

| Risk | Likelihood | Severity | Mitigation | Seen or latent |
|---|---|---|---|---|
| Two people served by one double-click / two tabs | medium | high | queue-row lock + expectedTokenId + button busy guard (DEC-005); DB + E2E tests | latent (tests not run yet) |
| Neon cold start makes the first request slow for the evaluator | high | medium | warm the DB just before the demo; Neon resumes in ~1 s (vs Render ~50 s) | latent |
| Better Auth / Next 16.4 APIs differ from training-era knowledge | medium | medium | read bundled docs (`node_modules/next/dist/docs`) and package types before use | seen (Cache Components default, `proxy` rename) |
| Serverless functions open too many Postgres connections | low | medium | Neon **pooled** URL + Pool max 5 | latent |
| Time-zone bugs in "today" / hour buckets | medium | medium | buckets computed in Postgres with the viewer's IANA zone; tested with UTC and Asia/Kolkata | latent |
| In-memory auth rate limit resets per serverless instance | high | low | acceptable for this scope; move to DB storage if abused | latent |
| Demo data mistaken for real data | low | medium | "Sample data" strip on every screen of the demo account | latent |
