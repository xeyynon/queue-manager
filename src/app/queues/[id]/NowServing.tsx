"use client";

import { Button } from "@/components/Button";
import { LocalTime } from "@/components/LocalTime";
import { formatDuration } from "@/lib/format";
import type { TokenDTO } from "@/lib/types";

const waited = (t: TokenDTO) => (t.servedAt ? (Date.parse(t.servedAt) - Date.parse(t.createdAt)) / 1000 : 0);

export function NowServing({
  current,
  recent,
  next,
  onServe,
}: {
  current: TokenDTO | null;
  recent: TokenDTO[];
  next: TokenDTO | null;
  onServe: () => void;
}) {
  return (
    <section aria-labelledby="serving-h" className="rounded-md bg-surface p-4">
      <h2 id="serving-h" className="text-sm font-medium text-ink-2">
        Now serving
      </h2>
      <div aria-live="polite" aria-atomic="true">
        {current ? (
          <div className="mt-2 flex items-center gap-4">
            <span className="ticket num inline-flex h-16 min-w-24 items-center justify-center pr-3 pl-2 text-4xl font-semibold text-ink">
              #{current.number}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-medium">{current.label ?? <span className="text-ink-3">No name</span>}</p>
              <p className="text-sm text-ink-2">
                called {current.servedAt ? <LocalTime iso={current.servedAt} /> : "—"} · waited{" "}
                <span className="tnum">{formatDuration(waited(current))}</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-ink-2">No one has been served yet.</p>
        )}
      </div>

      {/* Phones: the one primary action sits in a solid bottom bar. Desktop: inline. */}
      <div className="fixed inset-x-0 bottom-0 z-10 bg-bg px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:static lg:mt-5 lg:bg-transparent lg:p-0">
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          disabled={!next}
          aria-keyshortcuts="s"
          aria-describedby={!next ? "serve-reason" : undefined}
          onClick={onServe}
        >
          {next ? (
            <>
              Serve next <span className="num font-semibold">#{next.number}</span>
            </>
          ) : (
            "Serve next"
          )}
        </Button>
        {!next ? (
          <p id="serve-reason" className="mt-2 text-center text-sm text-ink-3">
            No one is waiting.
          </p>
        ) : null}
      </div>

      {recent.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-ink-2">Served before</h3>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
            {recent.map((t) => (
              <li key={t.id}>
                <span className="num text-ink">#{t.number}</span> {t.servedAt ? <LocalTime iso={t.servedAt} /> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
