"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bucketLabel } from "@/lib/format";
import type { AnalyticsDTO } from "@/lib/types";

// Chart colours are CSS variables, so light/dark switch with the theme (no literals).
const AXIS = { stroke: "var(--ink-3)", fontSize: 12, tickLine: false, axisLine: false } as const;

const timeOfDay = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayAndTime = (iso: string) =>
  new Date(iso).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

type TipProps = { active?: boolean; label?: string | number; payload?: { name?: string; value?: number; color?: string }[] };

function Tip({ active, label, payload, format }: TipProps & { format: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm bg-ink px-3 py-2 text-sm text-bg">
      <p className="num font-medium">{format(String(label))}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 flex items-center gap-2">
          <span
            aria-hidden
            className={`inline-block size-2.5 rounded-[2px] ${p.name === "Served" ? "bg-[var(--chart-b)]" : "bg-[var(--chart-a)]"}`}
          />
          {p.name}: <span className="num">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function TableView({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-ink-2 hover:text-ink">Show as table</summary>
      <div className="mt-2 max-h-72 overflow-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="text-ink-2">
              {head.map((h) => (
                <th key={h} scope="col" className="py-1 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="num py-0.5 pr-4">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function QueueLengthChart({ data }: { data: AnalyticsDTO }) {
  const fmt = data.range === "today" ? timeOfDay : dayAndTime;
  const tickFmt =
    data.range === "today"
      ? timeOfDay
      : (iso: string) => new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
  const hasAny = data.queueLength.some((p) => p.peak > 0);
  // Multi-day ranges: one tick per local midnight, so each date appears once.
  const ticks =
    data.range === "today"
      ? undefined
      : data.queueLength
          .map((p) => p.t)
          .filter((t) => {
            const d = new Date(t);
            return d.getHours() === 0 && d.getMinutes() === 0;
          })
          .filter((_, i, all) => data.range === "7d" || i % Math.ceil(all.length / 10) === 0);
  return (
    <>
      <div className="mt-4 h-64" role="img" aria-label={`Line chart of queue length, ${data.queueLength.length} points. Use "Show as table" for values.`}>
        {hasAny ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.queueLength} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="t" ticks={ticks} tickFormatter={tickFmt} minTickGap={ticks ? 4 : 40} {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip
                content={<Tip format={fmt} />}
                cursor={{ stroke: "var(--ink-3)", strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Line
                type="stepAfter"
                dataKey="peak"
                name="Waiting (peak)"
                stroke="var(--chart-line)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-ink-3">No one was waiting in this period.</p>
        )}
      </div>
      <TableView
        caption="Queue length"
        head={["Time", "Most waiting"]}
        rows={data.queueLength.filter((p) => p.peak > 0).map((p) => [fmt(p.t), p.peak])}
      />
    </>
  );
}

export function ThroughputChart({ data }: { data: AnalyticsDTO }) {
  const label = (b: string) => bucketLabel(b, data.bucketUnit);
  // Hours as "09"; a week as weekdays; a month as dates (weekdays repeat over 30 days).
  const tick = (b: string) => {
    if (data.bucketUnit === "hour") return b.slice(11, 13);
    if (data.range === "7d") return bucketLabel(b, "day").split(",")[0];
    const [y, m, d] = b.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString([], { day: "numeric", month: "short" });
  };
  const hasAny = data.throughput.some((r) => r.arrivals > 0 || r.served > 0);
  return (
    <>
      <div className="mt-4 h-64" role="img" aria-label={`Bar chart of arrivals and served per ${data.bucketUnit}. Use "Show as table" for values.`}>
        {hasAny ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.throughput} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="bucket" tickFormatter={tick} minTickGap={8} {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip content={<Tip format={label} />} cursor={{ fill: "var(--surface-2)" }} isAnimationActive={false} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                iconSize={10}
                height={28}
                formatter={(v: string) => <span className="text-sm text-ink-2">{v}</span>}
              />
              <Bar dataKey="arrivals" name="Arrived" fill="var(--chart-a)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="served" name="Served" fill="var(--chart-b)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-ink-3">No arrivals or serves in this period.</p>
        )}
      </div>
      <TableView
        caption={`Arrivals and served per ${data.bucketUnit}`}
        head={[data.bucketUnit === "hour" ? "Hour" : "Day", "Arrived", "Served"]}
        rows={data.throughput.map((r) => [label(r.bucket), r.arrivals, r.served])}
      />
    </>
  );
}
