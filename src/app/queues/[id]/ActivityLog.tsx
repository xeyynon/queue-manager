"use client";

import type { EventDTO } from "@/lib/types";

const VERB: Record<EventDTO["type"], string> = {
  token_added: "added",
  moved_up: "moved up",
  moved_down: "moved down",
  served: "served",
  cancelled: "cancelled",
  restored: "put back (undo)",
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** The audit trail: every add, reorder, serve and cancel, with who and when. */
export function ActivityLog({ events }: { events: EventDTO[] }) {
  return (
    <section aria-labelledby="activity-h" className="rounded-md bg-surface p-4">
      <h2 id="activity-h" className="text-sm font-medium text-ink-2">
        Activity
      </h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-ink-3">Every add, move, serve and cancel will be listed here.</p>
      ) : (
        <ol className="mt-2 max-h-80 space-y-1.5 overflow-y-auto pr-1 text-sm">
          {events.map((e) => (
            <li key={e.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
              <span className="num text-ink-3">{time(e.at)}</span>
              <span className="min-w-0 text-ink-2">
                <span className="num font-medium text-ink">#{e.tokenNumber ?? "?"}</span> {VERB[e.type]}
                {e.actorName ? <span className="text-ink-3"> · {e.actorName}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
      {events.length >= 30 ? <p className="mt-2 text-xs text-ink-3">Showing the latest 30 actions.</p> : null}
    </section>
  );
}
