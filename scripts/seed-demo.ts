/**
 * Seeds the DEMO account with 30 days of SIMULATED history, so an evaluator
 * can see the dashboard with data. Every screen of this account shows a
 * "Sample data" notice. Real accounts are never touched.
 *
 *   npm run seed:demo      (reads DATABASE_URL, DEMO_EMAIL, DEMO_PASSWORD from .env.local)
 *
 * The simulation is a seeded single-server queue per counter:
 * arrivals follow a clinic-day curve (peaks late morning and late afternoon),
 * service times are exponential, a few people leave if they wait too long
 * (cancelled), and a few are moved up for priority. Re-running replaces the
 * demo account's data with an identical-shaped fresh copy ending "now".
 */
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { createDb } from "../src/db/client";
import { account, queueEvents, queues, tokens, user } from "../src/db/schema";

config({ path: ".env.local" });

const DAYS = 30;
const TZ = process.env.DEMO_TZ ?? "Asia/Kolkata";
const OPEN_H = 9;
const CLOSE_H = 17;

type QueueSpec = { name: string; peakPerHour: number; meanServiceMin: number };
const SPECS: QueueSpec[] = [
  { name: "General OPD", peakPerHour: 16, meanServiceMin: 4.2 },
  { name: "Billing counter", peakPerHour: 12, meanServiceMin: 3.1 },
  { name: "Pharmacy", peakPerHour: 9, meanServiceMin: 5.5 },
];

// Deterministic RNG (mulberry32) so every seed run has the same shape.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261114);
const expo = (mean: number) => -Math.log(1 - rand()) * mean;

/** Relative arrival intensity by local hour: busy 10-12 and 16-17. */
function intensity(hour: number): number {
  const curve: Record<number, number> = { 9: 0.55, 10: 0.95, 11: 1, 12: 0.75, 13: 0.5, 14: 0.6, 15: 0.7, 16: 0.9, 17: 0.4 };
  return curve[Math.floor(hour)] ?? 0;
}

/** Minutes to add to UTC to get wall time in `tz` at instant `ms`. */
function tzOffsetMin(tz: string, ms: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const v = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return Math.round((asUtc - ms) / 60000);
}

/** UTC ms of local midnight `daysAgo` days before today in TZ. */
function localMidnight(daysAgo: number): number {
  const now = Date.now();
  const off = tzOffsetMin(TZ, now);
  const localNow = new Date(now + off * 60000);
  const midnightLocalAsUtc = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() - daysAgo);
  return midnightLocalAsUtc - tzOffsetMin(TZ, midnightLocalAsUtc) * 60000;
}

type SimToken = {
  id: string;
  number: number;
  position: number;
  createdAt: number;
  status: "waiting" | "served" | "cancelled";
  servedAt: number | null;
  cancelledAt: number | null;
  abandonAt: number;
  lastMove: "up" | null;
  lastMovedAt: number | null;
};
type SimEvent = { type: (typeof queueEvents.$inferInsert)["type"]; token: SimToken; at: number; waitingAfter: number };

function simulate(spec: QueueSpec, windows: [number, number][], now: number) {
  const all: SimToken[] = [];
  const events: SimEvent[] = [];
  let num = 0;
  const MIN = 60_000;

  for (const [open, close] of windows) {
    // Non-homogeneous Poisson arrivals by thinning.
    const arrivals: number[] = [];
    const peak = spec.peakPerHour / 60; // per minute
    for (let t = open; ; ) {
      t += expo(1 / peak) * MIN;
      if (t >= close || t >= now) break;
      const localHour = OPEN_H + (t - open) / (60 * MIN);
      if (rand() < intensity(localHour)) arrivals.push(t);
    }

    const waiting: SimToken[] = [];
    let serverFree = open;
    let ai = 0;
    const end = Math.min(close + 3 * 60 * MIN, now); // finish serving after doors close
    for (;;) {
      const nextArrival = ai < arrivals.length ? arrivals[ai] : Infinity;
      const nextServe = waiting.length ? Math.max(serverFree, waiting[0].createdAt) : Infinity;
      const nextAbandon = waiting.reduce((m, t) => Math.min(m, t.abandonAt), Infinity);
      const t = Math.min(nextArrival, nextServe, nextAbandon);
      if (t === Infinity || t > end) break;

      if (t === nextArrival) {
        ai++;
        num++;
        const tok: SimToken = {
          id: randomUUID(),
          number: num,
          position: num,
          createdAt: t,
          status: "waiting",
          servedAt: null,
          cancelledAt: null,
          // ~7% give up after 20-50 minutes if not served by then
          abandonAt: rand() < 0.07 ? t + (20 + rand() * 30) * MIN : Infinity,
          lastMove: null,
          lastMovedAt: null,
        };
        all.push(tok);
        waiting.push(tok);
        events.push({ type: "token_added", token: tok, at: t, waitingAfter: waiting.length });
        // ~4% are priority (elderly, emergency): moved up one place right after arriving.
        // The event is stamped 1 ms after the arrival so its waitingAfter is still true
        // (stamping it a minute later let serves in between make the count stale).
        if (waiting.length >= 3 && rand() < 0.04) {
          const i = waiting.length - 1;
          const ahead = waiting[i - 1];
          [tok.position, ahead.position] = [ahead.position, tok.position];
          waiting[i - 1] = tok;
          waiting[i] = ahead;
          tok.lastMove = "up";
          tok.lastMovedAt = t + 1;
          events.push({ type: "moved_up", token: tok, at: t + 1, waitingAfter: waiting.length });
        }
      } else if (t === nextServe) {
        const tok = waiting.shift()!;
        tok.status = "served";
        tok.servedAt = t;
        serverFree = t + expo(spec.meanServiceMin) * MIN;
        events.push({ type: "served", token: tok, at: t, waitingAfter: waiting.length });
      } else {
        const i = waiting.findIndex((x) => x.abandonAt === t);
        const [tok] = waiting.splice(i, 1);
        tok.status = "cancelled";
        tok.cancelledAt = t;
        events.push({ type: "cancelled", token: tok, at: t, waitingAfter: waiting.length });
      }
    }
  }
  return { all, events, lastNumber: num };
}

async function main() {
  const url = process.env.DATABASE_URL;
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!url || !email || !password) {
    throw new Error("Set DATABASE_URL, DEMO_EMAIL and DEMO_PASSWORD in .env.local");
  }
  const { db, pool } = createDb(url, 3);
  const now = Date.now();

  // Clinic hours on each of the last DAYS days. Today is open "since 3 hours ago"
  // so the live screens have people waiting whatever time the evaluator looks.
  const windows: [number, number][] = [];
  for (let d = DAYS - 1; d >= 1; d--) {
    const m = localMidnight(d);
    windows.push([m + OPEN_H * 3600_000, m + CLOSE_H * 3600_000]);
  }
  windows.push([now - 3 * 3600_000, now + 5 * 3600_000]);

  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(user).where(eq(user.email, email));
    if (existing) await tx.delete(user).where(eq(user.id, existing.id)); // cascades queues, tokens, events

    const userId = randomUUID();
    await tx.insert(user).values({ id: userId, name: "Demo Manager", email, emailVerified: true });
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
    });

    for (const spec of SPECS) {
      const sim = simulate(spec, windows, now);
      const queueId = randomUUID();
      await tx.insert(queues).values({
        id: queueId,
        ownerId: userId,
        name: spec.name,
        nextTokenNo: sim.lastNumber + 1,
        nextPosition: sim.lastNumber + 1,
        createdAt: new Date(windows[0][0] - 3600_000),
      });
      const d = (ms: number | null) => (ms === null ? null : new Date(ms));
      for (let i = 0; i < sim.all.length; i += 500) {
        await tx.insert(tokens).values(
          sim.all.slice(i, i + 500).map((t) => ({
            id: t.id,
            queueId,
            number: t.number,
            position: t.position,
            status: t.status,
            createdAt: new Date(t.createdAt),
            servedAt: d(t.servedAt),
            cancelledAt: d(t.cancelledAt),
            lastMove: t.lastMove,
            lastMovedAt: d(t.lastMovedAt),
          })),
        );
      }
      for (let i = 0; i < sim.events.length; i += 1000) {
        await tx.insert(queueEvents).values(
          sim.events.slice(i, i + 1000).map((e) => ({
            queueId,
            tokenId: e.token.id,
            tokenNumber: e.token.number,
            type: e.type,
            actorId: userId,
            waitingAfter: e.waitingAfter,
            at: new Date(e.at),
          })),
        );
      }
      const waitingNow = sim.all.filter((t) => t.status === "waiting").length;
      console.log(`${spec.name}: ${sim.all.length} tokens, ${sim.events.length} events, ${waitingNow} waiting now`);
    }
  });

  await pool.end();
  console.log(`Demo account ready: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
