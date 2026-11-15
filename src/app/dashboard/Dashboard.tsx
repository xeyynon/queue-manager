"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { usePolling } from "@/hooks/usePolling";
import { api, ApiFailure } from "@/lib/api";
import { bucketLabel, formatCount, formatDuration, formatPercent } from "@/lib/format";
import type { AnalyticsDTO } from "@/lib/types";
import type { Range } from "@/lib/validation";
import { QueueLengthChart, ThroughputChart } from "./Charts";

const RANGES: [Range, string][] = [
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
];

/** p90 and median need a few samples before they mean anything. */
const MIN_FOR_PERCENTILES = 5;

export function Dashboard({
  queues,
  initialQueue,
  initialRange,
}: {
  queues: { id: string; name: string }[];
  initialQueue: string;
  initialRange: Range;
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<AnalyticsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const d = await api<AnalyticsDTO>(`/api/analytics?queue=${encodeURIComponent(queue)}&range=${range}&tz=${encodeURIComponent(tz)}`);
      setData(d);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [queue, range]);

  useEffect(() => {
    // load() only sets state after its await (an async fetch), not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // Filters live in the URL so a dashboard view can be bookmarked or shared.
    const url = new URL(window.location.href);
    url.searchParams.set("range", range);
    if (queue === "all") url.searchParams.delete("queue");
    else url.searchParams.set("queue", queue);
    window.history.replaceState(null, "", url);
  }, [load, queue, range]);

  usePolling(() => void load(), 30_000);

  if (queues.length === 0) {
    return (
      <div className="rounded-md bg-surface px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-2">Wait times and queue trends appear here once you have a queue with some activity.</p>
        <Link href="/queues" className="mt-5 inline-block font-medium text-accent underline">
          Create a queue
        </Link>
      </div>
    );
  }

  const enough = data !== null && data.served >= MIN_FOR_PERCENTILES;
  const rangeLabel = RANGES.find(([r]) => r === range)?.[1].toLowerCase();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-ink-3" role="status">
          {error && data ? <span className="text-warn-ink">Update failed · showing data from </span> : "Updated "}
          {updatedAt ? <span className="num">{updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })}</span> : "…"}
          {" · refreshes every 30 s"}
        </p>
      </div>

      {/* Filters: one row above everything they control. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Queue
          <select
            value={queue}
            onChange={(e) => {
              setLoading(true);
              setQueue(e.target.value);
            }}
            className="h-9 max-w-64 rounded-md border border-field-line bg-surface-2 px-2 text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent pointer-coarse:h-11"
          >
            <option value="all">All queues</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-label="Time range">
          {RANGES.map(([r, label]) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => {
                if (r === range) return;
                setLoading(true);
                setRange(r);
              }}
              className="h-8 rounded-sm px-3 text-sm whitespace-nowrap text-ink-2 aria-pressed:bg-surface aria-pressed:font-medium aria-pressed:text-ink pointer-coarse:h-10"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && !data ? (
        <div className="mt-6 rounded-md bg-surface px-6 py-10 text-center" role="alert">
          <p className="font-semibold">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : !data ? (
        <div className="mt-6 grid gap-6" aria-busy="true" aria-label="Loading dashboard">
          <div className="h-28 animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
          <div className="h-72 animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
        </div>
      ) : (
        <div className={`mt-6 grid gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Headline figures: one strip, four numbers that answer "how are we doing?" */}
          <section aria-label="Key figures" className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-md bg-surface p-5 md:grid-cols-4">
            <Figure label="Waiting now" value={formatCount(data.waitingNow)} note="across selected queues" />
            <Figure
              label="Average wait"
              value={data.avgWaitSec !== null ? formatDuration(data.avgWaitSec) : "—"}
              note={
                data.avgWaitSec === null
                  ? `no one served ${rangeLabel}`
                  : enough && data.medianWaitSec !== null
                    ? `median ${formatDuration(data.medianWaitSec)} · ${formatCount(data.served)} served`
                    : `${formatCount(data.served)} served`
              }
            />
            <Figure
              label="9 in 10 seen within"
              value={enough && data.p90WaitSec !== null ? formatDuration(data.p90WaitSec) : "—"}
              note={enough ? "90th percentile wait" : `needs ${MIN_FOR_PERCENTILES}+ served (${data.served} so far)`}
            />
            <Figure
              label="Served"
              value={formatCount(data.served)}
              note={
                data.cancellationRate === null
                  ? `${formatCount(data.arrivals)} arrived`
                  : `${formatCount(data.arrivals)} arrived · ${formatCount(data.cancelled)} cancelled (${formatPercent(data.cancellationRate)})`
              }
            />
          </section>

          <section aria-labelledby="len-h" className="rounded-md bg-surface p-5">
            <h2 id="len-h" className="font-semibold">
              Queue length
            </h2>
            <p className="text-sm text-ink-2">
              Most people waiting at once, per{" "}
              {data.queueLengthBucketMinutes === 1440
                ? "day"
                : data.queueLengthBucketMinutes >= 60
                  ? data.queueLengthBucketMinutes === 60
                    ? "hour"
                    : `${data.queueLengthBucketMinutes / 60} h`
                  : `${data.queueLengthBucketMinutes} min`}
            </p>
            <QueueLengthChart data={data} />
          </section>

          <section aria-labelledby="tp-h" className="rounded-md bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="tp-h" className="font-semibold">
                  Arrivals and served per {data.bucketUnit}
                </h2>
                <p className="text-sm text-ink-2">
                  {data.busiest ? (
                    <>
                      Busiest {data.bucketUnit}: <span className="tnum font-medium text-ink">{bucketLabel(data.busiest.bucket, data.bucketUnit)}</span> with{" "}
                      <span className="num">{data.busiest.arrivals}</span> arrivals
                    </>
                  ) : (
                    `No arrivals ${rangeLabel}.`
                  )}
                </p>
              </div>
            </div>
            <ThroughputChart data={data} />
          </section>

          <p className="text-xs text-ink-3">
            Times are in {data.timeZone}. Wait = time from token issued to served; cancelled tokens are counted separately and don&rsquo;t affect wait times.
          </p>
        </div>
      )}
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="tnum mt-1 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-3">{note}</p>
    </div>
  );
}
