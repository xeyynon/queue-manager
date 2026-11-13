# API

All routes are same-origin JSON, need a signed-in session (cookie), and return `Cache-Control: no-store`.
Errors: `{ "error": { "code": "...", "message": "human sentence" } }`.

| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/api/queues` | — | `{ queues: QueueSummary[] }` | 401 |
| POST | `/api/queues` | `{ name }` | 201 `{ queue }` | 400 VALIDATION, 409 DUPLICATE_NAME |
| GET | `/api/queues/:id` | — | `QueueState` (waiting, nowServing, recentServed, recentServeTimes, events, serverNow) | 404 |
| PATCH | `/api/queues/:id` | `{ name }` | `{ ok }` | 400, 404, 409 DUPLICATE_NAME |
| DELETE | `/api/queues/:id` | — | `{ ok }` | 404 |
| POST | `/api/queues/:id/tokens` | `{ label? }` | 201 `{ token }` | 400, 404 |
| POST | `/api/queues/:id/tokens/:tokenId/move` | `{ direction: "up"\|"down" }` | `{ moved, token }` (moved=false at an edge) | 400, 404, 409 INVALID_STATE |
| POST | `/api/queues/:id/serve` | `{ expectedTokenId? }` | `{ token }` | 404, 409 EMPTY_QUEUE, 409 STALE |
| POST | `/api/queues/:id/tokens/:tokenId/cancel` | — | `{ token }` | 404, 409 INVALID_STATE |
| POST | `/api/queues/:id/tokens/:tokenId/restore` | — | `{ token }` | 404, 409 INVALID_STATE (not cancelled / older than 5 min) |
| GET | `/api/analytics?queue=all\|<id>&range=today\|7d\|30d&tz=<IANA>` | — | `Analytics` | 404 |
| * | `/api/auth/*` | Better Auth | | |

Types: `src/lib/types.ts`. 401 everywhere when the session is missing or expired.
