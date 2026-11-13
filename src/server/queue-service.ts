import { and, asc, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { queueEvents, queues, tokens, user, type Token } from "@/db/schema";
import type { EventDTO, QueueStateDTO, QueueSummaryDTO, TokenDTO } from "@/lib/types";
import { AppError } from "./errors";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type EventType = (typeof queueEvents.$inferInsert)["type"];

/** How long after cancelling a token "Undo" may still put it back. */
export const RESTORE_WINDOW_SECONDS = 5 * 60;

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function toTokenDTO(t: Token): TokenDTO {
  return {
    id: t.id,
    number: t.number,
    label: t.label,
    status: t.status,
    position: t.position,
    createdAt: t.createdAt.toISOString(),
    servedAt: iso(t.servedAt),
    cancelledAt: iso(t.cancelledAt),
    lastMove: t.lastMove,
    lastMovedAt: iso(t.lastMovedAt),
  };
}

function isUniqueViolation(err: unknown): boolean {
  // pg error code 23505; Drizzle may wrap the driver error in `cause`.
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

// Drizzle renders ${queues.id} as a bare "id" in a single-table select, which
// inside a correlated subquery resolves to the *subquery's* table (tokens.id).
// Always reference the outer row fully qualified. (B-01)
const OUTER_QUEUE_ID = sql.raw(`"queues"."id"`);

export async function listQueues(db: Db, ownerId: string): Promise<QueueSummaryDTO[]> {
  const rows = await db
    .select({
      id: queues.id,
      name: queues.name,
      createdAt: queues.createdAt,
      waiting: sql<number>`(select count(*)::int from ${tokens} t where t.queue_id = ${OUTER_QUEUE_ID} and t.status = 'waiting')`,
      oldestWaitingSince: sql<Date | null>`(select min(t.created_at) from ${tokens} t where t.queue_id = ${OUTER_QUEUE_ID} and t.status = 'waiting')`,
      nowServingNumber: sql<number | null>`(select t.number from ${tokens} t where t.queue_id = ${OUTER_QUEUE_ID} and t.status = 'served' order by t.served_at desc limit 1)`,
    })
    .from(queues)
    .where(eq(queues.ownerId, ownerId))
    .orderBy(asc(queues.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
    waiting: Number(r.waiting),
    // Subquery results come back as strings from pg, not Date objects.
    oldestWaitingSince: r.oldestWaitingSince ? new Date(r.oldestWaitingSince).toISOString() : null,
    nowServingNumber: r.nowServingNumber === null ? null : Number(r.nowServingNumber),
  }));
}

async function findOwnedQueue(db: Db | Tx, ownerId: string, queueId: string) {
  const [q] = await db
    .select()
    .from(queues)
    .where(and(eq(queues.id, queueId), eq(queues.ownerId, ownerId)));
  // Someone else's queue looks exactly like a missing one: no existence leak.
  if (!q) throw new AppError("NOT_FOUND", "This queue doesn't exist or isn't yours.");
  return q;
}

export async function getQueueState(db: Db, ownerId: string, queueId: string): Promise<QueueStateDTO> {
  const q = await findOwnedQueue(db, ownerId, queueId);

  const [waiting, served, events, nowRow] = await Promise.all([
    db
      .select()
      .from(tokens)
      .where(and(eq(tokens.queueId, queueId), eq(tokens.status, "waiting")))
      .orderBy(asc(tokens.position)),
    db
      .select()
      .from(tokens)
      .where(and(eq(tokens.queueId, queueId), eq(tokens.status, "served")))
      .orderBy(desc(tokens.servedAt))
      .limit(10),
    db
      .select({
        id: queueEvents.id,
        type: queueEvents.type,
        tokenNumber: queueEvents.tokenNumber,
        actorName: user.name,
        waitingAfter: queueEvents.waitingAfter,
        at: queueEvents.at,
      })
      .from(queueEvents)
      .leftJoin(user, eq(user.id, queueEvents.actorId))
      .where(eq(queueEvents.queueId, queueId))
      .orderBy(desc(queueEvents.at), desc(queueEvents.id))
      .limit(30),
    db.execute<{ now: Date | string }>(sql`select now() as now`),
  ]);

  const serverNow = new Date(nowRow.rows[0].now);
  const twoHoursAgo = serverNow.getTime() - 2 * 60 * 60 * 1000;

  return {
    queue: { id: q.id, name: q.name, createdAt: q.createdAt.toISOString() },
    waiting: waiting.map(toTokenDTO),
    nowServing: served[0] ? toTokenDTO(served[0]) : null,
    recentServed: served.slice(1, 6).map(toTokenDTO),
    recentServeTimes: served
      .filter((t) => t.servedAt && t.servedAt.getTime() >= twoHoursAgo)
      .map((t) => t.servedAt!.toISOString()),
    events: events.map(
      (e): EventDTO => ({
        id: e.id,
        type: e.type,
        tokenNumber: e.tokenNumber,
        actorName: e.actorName,
        waitingAfter: e.waitingAfter,
        at: e.at.toISOString(),
      }),
    ),
    serverNow: serverNow.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Queue CRUD                                                          */
/* ------------------------------------------------------------------ */

export async function createQueue(db: Db, ownerId: string, name: string) {
  try {
    const [q] = await db.insert(queues).values({ ownerId, name }).returning();
    return { id: q.id, name: q.name, createdAt: q.createdAt.toISOString() };
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError("DUPLICATE_NAME", `You already have a queue called "${name}".`);
    }
    throw err;
  }
}

export async function renameQueue(db: Db, ownerId: string, queueId: string, name: string) {
  await findOwnedQueue(db, ownerId, queueId);
  try {
    await db.update(queues).set({ name }).where(eq(queues.id, queueId));
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError("DUPLICATE_NAME", `You already have a queue called "${name}".`);
    }
    throw err;
  }
}

export async function deleteQueue(db: Db, ownerId: string, queueId: string) {
  await findOwnedQueue(db, ownerId, queueId);
  await db.delete(queues).where(eq(queues.id, queueId));
}

/* ------------------------------------------------------------------ */
/* Mutations. Each one runs in a transaction that first locks the      */
/* queue row (SELECT ... FOR UPDATE). That serialises every change to  */
/* one queue: two "Serve next" clicks, or a move racing a serve, run   */
/* one after the other instead of interleaving. See DEC-005.           */
/* ------------------------------------------------------------------ */

async function lockOwnedQueue(tx: Tx, ownerId: string, queueId: string) {
  const [q] = await tx
    .select()
    .from(queues)
    .where(and(eq(queues.id, queueId), eq(queues.ownerId, ownerId)))
    .for("update");
  if (!q) throw new AppError("NOT_FOUND", "This queue doesn't exist or isn't yours.");
  return q;
}

async function countWaiting(tx: Tx, queueId: string): Promise<number> {
  const [r] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(tokens)
    .where(and(eq(tokens.queueId, queueId), eq(tokens.status, "waiting")));
  return Number(r.n);
}

async function logEvent(tx: Tx, queueId: string, actorId: string, type: EventType, token: Token) {
  await tx.insert(queueEvents).values({
    queueId,
    actorId,
    type,
    tokenId: token.id,
    tokenNumber: token.number,
    waitingAfter: await countWaiting(tx, queueId),
  });
}

async function getTokenInQueue(tx: Tx, queueId: string, tokenId: string): Promise<Token> {
  const [t] = await tx
    .select()
    .from(tokens)
    .where(and(eq(tokens.id, tokenId), eq(tokens.queueId, queueId)));
  if (!t) throw new AppError("NOT_FOUND", "That token isn't in this queue.");
  return t;
}

function requireWaiting(t: Token) {
  if (t.status === "served") throw new AppError("INVALID_STATE", `Token #${t.number} has already been served.`);
  if (t.status === "cancelled") throw new AppError("INVALID_STATE", `Token #${t.number} was cancelled.`);
}

export async function addToken(db: Db, ownerId: string, queueId: string, label: string | null) {
  return db.transaction(async (tx) => {
    const q = await lockOwnedQueue(tx, ownerId, queueId);
    await tx
      .update(queues)
      .set({ nextTokenNo: q.nextTokenNo + 1, nextPosition: q.nextPosition + 1 })
      .where(eq(queues.id, queueId));
    const [t] = await tx
      .insert(tokens)
      .values({ queueId, number: q.nextTokenNo, position: q.nextPosition, label })
      .returning();
    await logEvent(tx, queueId, ownerId, "token_added", t);
    return toTokenDTO(t);
  });
}

export type MoveResult = { moved: boolean; token: TokenDTO };

export async function moveToken(
  db: Db,
  ownerId: string,
  queueId: string,
  tokenId: string,
  direction: "up" | "down",
): Promise<MoveResult> {
  return db.transaction(async (tx) => {
    await lockOwnedQueue(tx, ownerId, queueId);
    const t = await getTokenInQueue(tx, queueId, tokenId);
    requireWaiting(t);

    const [neighbour] = await tx
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.queueId, queueId),
          eq(tokens.status, "waiting"),
          direction === "up" ? lt(tokens.position, t.position) : gt(tokens.position, t.position),
        ),
      )
      .orderBy(direction === "up" ? desc(tokens.position) : asc(tokens.position))
      .limit(1);

    // Already first (moving up) or last (moving down): nothing to do, not an error.
    if (!neighbour) return { moved: false, token: toTokenDTO(t) };

    // Swap positions. The unique (queue_id, position) index is checked per row,
    // so park the token on a free negative slot first.
    await tx.update(tokens).set({ position: -t.position }).where(eq(tokens.id, t.id));
    await tx.update(tokens).set({ position: t.position }).where(eq(tokens.id, neighbour.id));
    const [updated] = await tx
      .update(tokens)
      .set({ position: neighbour.position, lastMove: direction, lastMovedAt: sql`now()` })
      .where(eq(tokens.id, t.id))
      .returning();

    await logEvent(tx, queueId, ownerId, direction === "up" ? "moved_up" : "moved_down", updated);
    return { moved: true, token: toTokenDTO(updated) };
  });
}

/**
 * Serve the token at the top of the queue.
 * `expectedTokenId` is the token the manager saw at the top. If the queue has
 * changed since (another tab served, or a reorder landed), nothing is served
 * and STALE is returned, so a double-click can never serve two people.
 */
export async function serveNext(db: Db, ownerId: string, queueId: string, expectedTokenId?: string) {
  return db.transaction(async (tx) => {
    await lockOwnedQueue(tx, ownerId, queueId);
    const [top] = await tx
      .select()
      .from(tokens)
      .where(and(eq(tokens.queueId, queueId), eq(tokens.status, "waiting")))
      .orderBy(asc(tokens.position))
      .limit(1);

    if (!top) throw new AppError("EMPTY_QUEUE", "No one is waiting in this queue.");
    if (expectedTokenId && top.id !== expectedTokenId) {
      throw new AppError("STALE", "The queue changed before your click landed. It has been refreshed; check the top token and try again.");
    }

    const [served] = await tx
      .update(tokens)
      .set({ status: "served", servedAt: sql`now()` })
      .where(eq(tokens.id, top.id))
      .returning();
    await logEvent(tx, queueId, ownerId, "served", served);
    return toTokenDTO(served);
  });
}

export async function cancelToken(db: Db, ownerId: string, queueId: string, tokenId: string) {
  return db.transaction(async (tx) => {
    await lockOwnedQueue(tx, ownerId, queueId);
    const t = await getTokenInQueue(tx, queueId, tokenId);
    requireWaiting(t);
    const [cancelled] = await tx
      .update(tokens)
      .set({ status: "cancelled", cancelledAt: sql`now()` })
      .where(eq(tokens.id, t.id))
      .returning();
    await logEvent(tx, queueId, ownerId, "cancelled", cancelled);
    return toTokenDTO(cancelled);
  });
}

/** Undo a cancel. The token keeps its old position, so it returns to the same place in line. */
export async function restoreToken(db: Db, ownerId: string, queueId: string, tokenId: string) {
  return db.transaction(async (tx) => {
    await lockOwnedQueue(tx, ownerId, queueId);
    const t = await getTokenInQueue(tx, queueId, tokenId);
    if (t.status !== "cancelled") {
      throw new AppError("INVALID_STATE", `Token #${t.number} isn't cancelled, so there's nothing to undo.`);
    }
    const [fresh] = await tx
      .select({ id: tokens.id })
      .from(tokens)
      .where(
        and(
          eq(tokens.id, t.id),
          gte(tokens.cancelledAt, sql`now() - make_interval(secs => ${RESTORE_WINDOW_SECONDS})`),
        ),
      );
    if (!fresh) {
      throw new AppError("INVALID_STATE", `Token #${t.number} was cancelled too long ago to undo. Add a new token instead.`);
    }
    const [restored] = await tx
      .update(tokens)
      .set({ status: "waiting", cancelledAt: null })
      .where(eq(tokens.id, t.id))
      .returning();
    await logEvent(tx, queueId, ownerId, "restored", restored);
    return toTokenDTO(restored);
  });
}
