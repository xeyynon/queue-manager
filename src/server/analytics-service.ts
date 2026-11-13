import { sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import type { Range } from "@/lib/validation";
import type { AnalyticsDTO } from "@/lib/types";
import { buildQueueLengthSeries } from "@/lib/series";
import { AppError } from "./errors";

const RANGE_DAYS: Record<Range, number> = { today: 1, "7d": 7, "30d": 30 };
// Bucket for the queue-length chart: fine enough to see a rush, coarse enough to read.
const LENGTH_BUCKET_MIN: Record<Range, number> = { today: 15, "7d": 60, "30d": 1440 };

type Num = number | string | null;
const num = (v: Num) => (v === null ? null : Number(v));

/**
 * Dashboard numbers for one queue, or for all of the manager's queues when
 * `queueId` is null. "Today" and day/hour buckets follow the viewer's time zone.
 */
export async function getAnalytics(
  db: Db,
  ownerId: string,
  opts: { queueId: string | null; range: Range; timeZone: string },
): Promise<AnalyticsDTO> {
  const { queueId, range, timeZone: tz } = opts;
  const days = RANGE_DAYS[range];
  const unit = range === "today" ? "hour" : "day";

  // Set of queues in scope. A queueId that isn't the owner's is a 404.
  const scope = await db.execute<{ id: string }>(sql`
    select id from queues
    where owner_id = ${ownerId} ${queueId ? sql`and id = ${queueId}` : sql``}
  `);
  if (queueId && scope.rows.length === 0) {
    throw new AppError("NOT_FOUND", "This queue doesn't exist or isn't yours.");
  }
  const ids = scope.rows.map((r) => r.id);
  const idList = ids.length ? sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `) : sql`null::uuid`;

  const boundsRes = await db.execute<{ from_ts: string | Date; to_ts: string | Date }>(sql`
    select ((date_trunc('day', now() at time zone ${tz}) - make_interval(days => ${days - 1})) at time zone ${tz}) as from_ts,
           now() as to_ts
  `);
  const fromTs = new Date(boundsRes.rows[0].from_ts);
  const toTs = new Date(boundsRes.rows[0].to_ts);

  const [kpiRes, throughputRes, initialRes, eventsRes] = await Promise.all([
    db.execute<{
      waiting_now: Num;
      arrivals: Num;
      served: Num;
      cancelled: Num;
      avg_wait: Num;
      median_wait: Num;
      p90_wait: Num;
    }>(sql`
      with served as (
        select extract(epoch from (served_at - created_at)) as wait
        from tokens
        where queue_id in (${idList}) and status = 'served' and served_at >= ${fromTs}
      )
      select
        (select count(*) from tokens where queue_id in (${idList}) and status = 'waiting') as waiting_now,
        (select count(*) from tokens where queue_id in (${idList}) and created_at >= ${fromTs}) as arrivals,
        (select count(*) from served) as served,
        (select count(*) from tokens where queue_id in (${idList}) and status = 'cancelled' and cancelled_at >= ${fromTs}) as cancelled,
        (select avg(wait) from served) as avg_wait,
        (select percentile_cont(0.5) within group (order by wait) from served) as median_wait,
        (select percentile_cont(0.9) within group (order by wait) from served) as p90_wait
    `),
    db.execute<{ bucket: string; arrivals: Num; served: Num }>(sql`
      with buckets as (
        select generate_series(
          date_trunc(${unit}, ${fromTs}::timestamptz at time zone ${tz}),
          date_trunc(${unit}, now() at time zone ${tz}),
          ${unit === "hour" ? sql`interval '1 hour'` : sql`interval '1 day'`}
        ) as b
      ),
      a as (
        select date_trunc(${unit}, created_at at time zone ${tz}) as b, count(*) as n
        from tokens where queue_id in (${idList}) and created_at >= ${fromTs}
        group by 1
      ),
      s as (
        select date_trunc(${unit}, served_at at time zone ${tz}) as b, count(*) as n
        from tokens where queue_id in (${idList}) and status = 'served' and served_at >= ${fromTs}
        group by 1
      )
      select to_char(buckets.b, 'YYYY-MM-DD"T"HH24:MI') as bucket,
             coalesce(a.n, 0) as arrivals,
             coalesce(s.n, 0) as served
      from buckets
      left join a on a.b = buckets.b
      left join s on s.b = buckets.b
      order by buckets.b
    `),
    db.execute<{ queue_id: string; waiting_after: Num }>(sql`
      select distinct on (queue_id) queue_id, waiting_after
      from queue_events
      where queue_id in (${idList}) and at < ${fromTs}
      order by queue_id, at desc, id desc
    `),
    db.execute<{ queue_id: string; at: string | Date; waiting_after: Num }>(sql`
      select queue_id, at, waiting_after
      from queue_events
      where queue_id in (${idList}) and at >= ${fromTs}
      order by at, id
    `),
  ]);

  const k = kpiRes.rows[0];
  const served = Number(k.served);
  const cancelled = Number(k.cancelled);
  const throughput = throughputRes.rows.map((r) => ({
    bucket: r.bucket,
    arrivals: Number(r.arrivals),
    served: Number(r.served),
  }));

  const busiestRow = throughput.reduce<(typeof throughput)[number] | null>(
    (best, r) => (r.arrivals > 0 && (!best || r.arrivals > best.arrivals) ? r : best),
    null,
  );

  const bucketMin = LENGTH_BUCKET_MIN[range];
  const series = buildQueueLengthSeries({
    from: fromTs.getTime(),
    to: toTs.getTime(),
    now: toTs.getTime(),
    bucketMs: bucketMin * 60_000,
    initial: Object.fromEntries(initialRes.rows.map((r) => [r.queue_id, Number(r.waiting_after)])),
    events: eventsRes.rows.map((r) => ({
      queueId: r.queue_id,
      at: new Date(r.at).getTime(),
      waitingAfter: Number(r.waiting_after),
    })),
  });

  return {
    range,
    timeZone: tz,
    from: fromTs.toISOString(),
    to: toTs.toISOString(),
    waitingNow: Number(k.waiting_now),
    arrivals: Number(k.arrivals),
    served,
    cancelled,
    cancellationRate: served + cancelled > 0 ? cancelled / (served + cancelled) : null,
    avgWaitSec: num(k.avg_wait),
    medianWaitSec: num(k.median_wait),
    p90WaitSec: num(k.p90_wait),
    throughput,
    bucketUnit: unit,
    queueLength: series.map((p) => ({ t: new Date(p.t).toISOString(), peak: p.peak })),
    queueLengthBucketMinutes: bucketMin,
    busiest: busiestRow ? { bucket: busiestRow.bucket, arrivals: busiestRow.arrivals } : null,
  };
}
