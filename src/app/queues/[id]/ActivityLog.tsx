"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { LocalTime } from "@/components/LocalTime";
import type { EventDTO } from "@/lib/types";

const VERB: Record<EventDTO["type"], string> = {
  token_added: "added",
  moved_up: "moved up",
  moved_down: "moved down",
  served: "served",
  cancelled: "cancelled",
  restored: "put back (undo)",
};

/** Rows shown before "Show more": the panel grows with the page instead of scrolling inside it. */
const FIRST = 10;

/** The audit trail: every add, reorder, serve and cancel, with who and when. */
export function ActivityLog({ events }: { events: EventDTO[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? events : events.slice(0, FIRST);
  // One account has one manager, so the name only says something when actors differ.
  const showActor = new Set(events.map((e) => e.actorName)).size > 1;
  return (
    <section aria-labelledby="activity-h" className="rounded-md bg-surface p-4">
      <h2 id="activity-h" className="text-sm font-medium text-ink-2">
        Activity
      </h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-ink-3">Every add, move, serve and cancel will be listed here.</p>
      ) : (
        <ol className="mt-2 space-y-1.5 text-sm">
          {shown.map((e) => (
            <li key={e.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
              <LocalTime iso={e.at} seconds className="num text-ink-3" />
              <span className="min-w-0 text-ink-2">
                <span className="num font-medium text-ink">#{e.tokenNumber ?? "?"}</span> {VERB[e.type]}
                {showActor && e.actorName ? <span className="text-ink-3"> · {e.actorName}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
      {events.length > FIRST && !all ? (
        <Button variant="ghost" size="sm" className="mt-2 -ml-2.5" onClick={() => setAll(true)}>
          Show {events.length - FIRST} more
        </Button>
      ) : events.length >= 30 ? (
        <p className="mt-2 text-xs text-ink-3">Showing the latest 30 actions.</p>
      ) : null}
    </section>
  );
}
