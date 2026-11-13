import { and, eq, sql } from "drizzle-orm";
import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { queueEvents, tokens } from "@/db/schema";
import { getAnalytics } from "@/server/analytics-service";
import { AppError } from "@/server/errors";
import {
  addToken,
  cancelToken,
  createQueue,
  deleteQueue,
  getQueueState,
  listQueues,
  moveToken,
  renameQueue,
  restoreToken,
  serveNext,
} from "@/server/queue-service";
import { makeUser, openTestDb, resetDb, testDbUrl } from "./setup";

// Tests against a real Postgres (Neon test branch): locking and constraints
// can't be faked. Skipped, not passed, when TEST_DATABASE_URL is missing.
const run = testDbUrl() ? describe : describe.skip;

let db: Db;
let pool: Pool;
const A = "manager-a";
const B = "manager-b";

async function expectCode(p: Promise<unknown>, code: string) {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err, `expected ${code}`).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
}

const numbers = async (queueId: string, owner = A) => (await getQueueState(db, owner, queueId)).waiting.map((t) => t.number);

run("queue service (Postgres)", () => {
  beforeAll(async () => {
    ({ db, pool } = await openTestDb());
  });
  afterAll(async () => {
    await pool?.end();
  });
  beforeEach(async () => {
    await resetDb(db);
    await makeUser(db, A);
    await makeUser(db, B);
  });

  describe("R1/R2 · create queues with a name", () => {
    it("creates and lists a manager's queues", async () => {
      await createQueue(db, A, "General OPD");
      await createQueue(db, A, "Billing");
      const list = await listQueues(db, A);
      expect(list.map((q) => q.name)).toEqual(["General OPD", "Billing"]);
      expect(list[0].waiting).toBe(0);
      expect(await listQueues(db, B)).toEqual([]);
    });

    it("rejects a duplicate name for the same manager, ignoring case", async () => {
      await createQueue(db, A, "Billing");
      await expectCode(createQueue(db, A, "billing"), "DUPLICATE_NAME");
      // Another manager may use the same name.
      await expect(createQueue(db, B, "Billing")).resolves.toBeTruthy();
    });

    it("renames and deletes (with all tokens)", async () => {
      const q = await createQueue(db, A, "Old");
      await addToken(db, A, q.id, null);
      await renameQueue(db, A, q.id, "New");
      expect((await getQueueState(db, A, q.id)).queue.name).toBe("New");
      await deleteQueue(db, A, q.id);
      await expectCode(getQueueState(db, A, q.id), "NOT_FOUND");
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(tokens);
      expect(n).toBe(0);
    });
  });

  describe("R3/R4 · add tokens and list them in order", () => {
    it("numbers tokens 1, 2, 3 and lists them in order", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, "Ravi");
      await addToken(db, A, q.id, null);
      await addToken(db, A, q.id, null);
      expect(t1.number).toBe(1);
      expect(t1.label).toBe("Ravi");
      expect(await numbers(q.id)).toEqual([1, 2, 3]);
    });

    it("never repeats a number, even under 20 simultaneous adds", async () => {
      const q = await createQueue(db, A, "Rush");
      const added = await Promise.all(Array.from({ length: 20 }, () => addToken(db, A, q.id, null)));
      const nums = added.map((t) => t.number).sort((a, b) => a - b);
      expect(nums).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    it("never reuses a cancelled token's number", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      await cancelToken(db, A, q.id, t1.id);
      const t2 = await addToken(db, A, q.id, null);
      expect(t2.number).toBe(2);
    });
  });

  describe("R5 · move tokens up and down", () => {
    it("swaps neighbours and records the move", async () => {
      const q = await createQueue(db, A, "Q");
      const [, , t3] = [await addToken(db, A, q.id, null), await addToken(db, A, q.id, null), await addToken(db, A, q.id, null)];
      const r = await moveToken(db, A, q.id, t3.id, "up");
      expect(r.moved).toBe(true);
      expect(await numbers(q.id)).toEqual([1, 3, 2]);
      const s = await getQueueState(db, A, q.id);
      expect(s.waiting[1].lastMove).toBe("up");
      expect(s.events[0].type).toBe("moved_up");
      await moveToken(db, A, q.id, t3.id, "down");
      expect(await numbers(q.id)).toEqual([1, 2, 3]);
    });

    it("treats first-up and last-down as nothing to do, not an error", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      expect((await moveToken(db, A, q.id, t1.id, "up")).moved).toBe(false);
      expect((await moveToken(db, A, q.id, t2.id, "down")).moved).toBe(false);
      expect(await numbers(q.id)).toEqual([1, 2]);
    });

    it("skips over served and cancelled tokens when moving", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      const t3 = await addToken(db, A, q.id, null);
      await cancelToken(db, A, q.id, t2.id);
      await moveToken(db, A, q.id, t3.id, "up");
      expect(await numbers(q.id)).toEqual([3, 1]);
      void t1;
    });

    it("rejects moving a served or cancelled token", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      await serveNext(db, A, q.id);
      await cancelToken(db, A, q.id, t2.id);
      await expectCode(moveToken(db, A, q.id, t1.id, "down"), "INVALID_STATE");
      await expectCode(moveToken(db, A, q.id, t2.id, "up"), "INVALID_STATE");
    });

    it("keeps positions unique under many simultaneous moves", async () => {
      const q = await createQueue(db, A, "Q");
      const ts = [];
      for (let i = 0; i < 6; i++) ts.push(await addToken(db, A, q.id, null));
      await Promise.all(ts.flatMap((t) => [moveToken(db, A, q.id, t.id, "up"), moveToken(db, A, q.id, t.id, "down")]));
      const after = await numbers(q.id);
      expect([...after].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe("R6 · serve the top token", () => {
    it("serves the top token and shows it as now serving", async () => {
      const q = await createQueue(db, A, "Q");
      await addToken(db, A, q.id, null);
      await addToken(db, A, q.id, null);
      const served = await serveNext(db, A, q.id);
      expect(served.number).toBe(1);
      expect(served.servedAt).not.toBeNull();
      const s = await getQueueState(db, A, q.id);
      expect(s.nowServing?.number).toBe(1);
      expect(s.waiting.map((t) => t.number)).toEqual([2]);
    });

    it("rejects serving an empty queue with a clear message", async () => {
      const q = await createQueue(db, A, "Q");
      await expectCode(serveNext(db, A, q.id), "EMPTY_QUEUE");
    });

    it("a double-click (same expected token, sent twice at once) serves exactly one person", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      await addToken(db, A, q.id, null);
      const results = await Promise.allSettled(Array.from({ length: 10 }, () => serveNext(db, A, q.id, t1.id)));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      for (const r of results) if (r.status === "rejected") expect((r.reason as AppError).code).toBe("STALE");
      expect(await numbers(q.id)).toEqual([2]);
    });

    it("parallel serves without an expected token never serve one person twice", async () => {
      const q = await createQueue(db, A, "Q");
      for (let i = 0; i < 5; i++) await addToken(db, A, q.id, null);
      const results = await Promise.allSettled(Array.from({ length: 8 }, () => serveNext(db, A, q.id)));
      const served = results.flatMap((r) => (r.status === "fulfilled" ? [r.value.number] : []));
      expect(served.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
      const empty = results.filter((r) => r.status === "rejected" && (r.reason as AppError).code === "EMPTY_QUEUE");
      expect(empty).toHaveLength(3);
    });

    it("serves in the order after reordering", async () => {
      const q = await createQueue(db, A, "Q");
      await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      await moveToken(db, A, q.id, t2.id, "up");
      expect((await serveNext(db, A, q.id)).number).toBe(2);
    });
  });

  describe("R7 · cancel a token (with undo)", () => {
    it("cancels, then undo puts it back in the same place", async () => {
      const q = await createQueue(db, A, "Q");
      await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      await addToken(db, A, q.id, null);
      await cancelToken(db, A, q.id, t2.id);
      expect(await numbers(q.id)).toEqual([1, 3]);
      await restoreToken(db, A, q.id, t2.id);
      expect(await numbers(q.id)).toEqual([1, 2, 3]);
    });

    it("rejects cancelling twice, cancelling a served token, and restoring a live one", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      await serveNext(db, A, q.id);
      await expectCode(cancelToken(db, A, q.id, t1.id), "INVALID_STATE");
      await cancelToken(db, A, q.id, t2.id);
      await expectCode(cancelToken(db, A, q.id, t2.id), "INVALID_STATE");
      await expectCode(restoreToken(db, A, q.id, t1.id), "INVALID_STATE");
    });

    it("refuses undo after the undo window", async () => {
      const q = await createQueue(db, A, "Q");
      const t = await addToken(db, A, q.id, null);
      await cancelToken(db, A, q.id, t.id);
      await db
        .update(tokens)
        .set({ cancelledAt: sql`now() - interval '1 hour'` })
        .where(eq(tokens.id, t.id));
      await expectCode(restoreToken(db, A, q.id, t.id), "INVALID_STATE");
    });
  });

  describe("ownership: one manager can never touch another's queue", () => {
    it("every read and write on B's behalf gets NOT_FOUND", async () => {
      const q = await createQueue(db, A, "Private");
      const t = await addToken(db, A, q.id, null);
      await expectCode(getQueueState(db, B, q.id), "NOT_FOUND");
      await expectCode(addToken(db, B, q.id, null), "NOT_FOUND");
      await expectCode(moveToken(db, B, q.id, t.id, "down"), "NOT_FOUND");
      await expectCode(serveNext(db, B, q.id), "NOT_FOUND");
      await expectCode(cancelToken(db, B, q.id, t.id), "NOT_FOUND");
      await expectCode(renameQueue(db, B, q.id, "Mine now"), "NOT_FOUND");
      await expectCode(deleteQueue(db, B, q.id), "NOT_FOUND");
      await expectCode(getAnalytics(db, B, { queueId: q.id, range: "today", timeZone: "UTC" }), "NOT_FOUND");
      expect(await numbers(q.id)).toEqual([1]);
    });

    it("a token id from another queue is NOT_FOUND", async () => {
      const q1 = await createQueue(db, A, "One");
      const q2 = await createQueue(db, A, "Two");
      const t = await addToken(db, A, q1.id, null);
      await expectCode(cancelToken(db, A, q2.id, t.id), "NOT_FOUND");
    });
  });

  describe("audit log", () => {
    it("logs every action with the waiting count after it", async () => {
      const q = await createQueue(db, A, "Q");
      const t1 = await addToken(db, A, q.id, null);
      const t2 = await addToken(db, A, q.id, null);
      await moveToken(db, A, q.id, t2.id, "up");
      await cancelToken(db, A, q.id, t1.id);
      await restoreToken(db, A, q.id, t1.id);
      await serveNext(db, A, q.id);
      const ev = await db
        .select({ type: queueEvents.type, n: queueEvents.waitingAfter, actor: queueEvents.actorId })
        .from(queueEvents)
        .where(and(eq(queueEvents.queueId, q.id)))
        .orderBy(queueEvents.at);
      expect(ev.map((e) => [e.type, e.n])).toEqual([
        ["token_added", 1],
        ["token_added", 2],
        ["moved_up", 2],
        ["cancelled", 1],
        ["restored", 2],
        ["served", 1],
      ]);
      expect(ev.every((e) => e.actor === A)).toBe(true);
    });
  });

  describe("R8 · analytics", () => {
    it("computes waits, percentiles, counts and buckets from timestamps", async () => {
      const q = await createQueue(db, A, "Q");
      // 10 served tokens with waits of 1..10 minutes, finished within the last hour.
      for (let i = 1; i <= 10; i++) {
        const t = await addToken(db, A, q.id, null);
        await db
          .update(tokens)
          .set({
            status: "served",
            createdAt: sql`now() - make_interval(mins => ${30 + i})`,
            servedAt: sql`now() - interval '30 minutes'`,
          })
          .where(eq(tokens.id, t.id));
      }
      const c = await addToken(db, A, q.id, null);
      await cancelToken(db, A, q.id, c.id);
      await addToken(db, A, q.id, null); // still waiting

      const a = await getAnalytics(db, A, { queueId: q.id, range: "today", timeZone: "UTC" });
      expect(a.served).toBe(10);
      expect(a.cancelled).toBe(1);
      expect(a.waitingNow).toBe(1);
      expect(a.arrivals).toBeGreaterThanOrEqual(2);
      expect(a.avgWaitSec).toBeCloseTo(330, 0); // mean of 60..600 s
      expect(a.medianWaitSec).toBeCloseTo(330, 0);
      expect(a.p90WaitSec).toBeCloseTo(546, 0); // percentile_cont(0.9) of 60..600
      expect(a.cancellationRate).toBeCloseTo(1 / 11, 5);
      expect(a.bucketUnit).toBe("hour");
      expect(a.throughput.reduce((s, r) => s + r.served, 0)).toBe(10);
      expect(a.queueLength.length).toBeGreaterThan(0);

      const all = await getAnalytics(db, A, { queueId: null, range: "7d", timeZone: "Asia/Kolkata" });
      expect(all.served).toBe(10);
      expect(all.throughput).toHaveLength(7);
    });

    it("returns honest empties for a quiet queue", async () => {
      await createQueue(db, A, "Quiet");
      const a = await getAnalytics(db, A, { queueId: null, range: "today", timeZone: "UTC" });
      expect(a.served).toBe(0);
      expect(a.avgWaitSec).toBeNull();
      expect(a.p90WaitSec).toBeNull();
      expect(a.cancellationRate).toBeNull();
      expect(a.busiest).toBeNull();
    });
  });
});
