"use client";

import { Button } from "@/components/Button";
import { IconClock, IconDown, IconPlus, IconUp, IconX } from "@/components/Icons";
import { estimateWaitSeconds } from "@/lib/estimate";
import { formatClock, formatEstimate, LONG_WAIT_SECONDS } from "@/lib/format";
import type { TokenDTO } from "@/lib/types";

type Props = {
  tokens: TokenDTO[];
  now: number;
  interval: number | null;
  lastServeAt: string | null;
  onMove: (t: TokenDTO, d: "up" | "down") => void;
  onCancel: (t: TokenDTO) => void;
  onAddFirst: () => void;
};

export function WaitingList({ tokens, now, interval, lastServeAt, onMove, onCancel, onAddFirst }: Props) {
  if (tokens.length === 0) {
    return (
      <div className="rounded-md bg-surface px-6 py-12 text-center">
        <p className="text-lg font-semibold">No one&rsquo;s waiting</p>
        <p className="mx-auto mt-1 max-w-sm text-ink-2">
          When someone arrives, add a token. They&rsquo;ll appear here in order, with how long they&rsquo;ve waited.
        </p>
        <Button variant="secondary" className="mt-5" onClick={onAddFirst}>
          <IconPlus />
          Add the first token
        </Button>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-line overflow-hidden rounded-md bg-surface" aria-label="Waiting tokens, in serving order">
      {tokens.map((t, i) => {
        const waitedSec = (now - Date.parse(t.createdAt)) / 1000;
        const long = waitedSec >= LONG_WAIT_SECONDS;
        const est = estimateWaitSeconds(i + 1, interval, lastServeAt, now);
        const first = i === 0;
        const last = i === tokens.length - 1;
        return (
          <li
            key={t.id}
            data-testid="waiting-row"
            className="grid grid-cols-[24px_auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-3 sm:grid-cols-[24px_auto_minmax(0,1fr)_150px_88px_auto]"
          >
            <span className="num text-right text-sm text-ink-3">
              <span className="sr-only">Position </span>
              {i + 1}
            </span>
            <span className="ticket num inline-flex h-10 min-w-16 items-center justify-center justify-self-start pr-2.5 pl-2 text-lg font-semibold">
              #{t.number}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{t.label ?? <span className="font-normal text-ink-3">No name</span>}</p>
              {t.lastMove ? (
                <p className="flex items-center gap-1 text-xs text-ink-3">
                  {t.lastMove === "up" ? <IconUp className="size-3" /> : <IconDown className="size-3" />}
                  moved {t.lastMove} by manager
                </p>
              ) : null}
            </div>

            {/* Phones: wait + estimate wrap to a second line under the name. */}
            <div className="col-span-3 col-start-2 row-start-2 flex items-center gap-4 text-sm whitespace-nowrap sm:contents">
              <p className={`flex items-center gap-1.5 whitespace-nowrap ${long ? "font-medium text-warn-ink" : "text-ink-2"}`}>
                <IconClock />
                <span>
                  <span className="sr-only">Waited </span>
                  <span className="num">{formatClock(waitedSec)}</span>
                  {long ? " · long wait" : ""}
                </span>
              </p>
              <p className="whitespace-nowrap text-ink-2" title="Estimated time until called, from the recent serving pace">
                <span className="text-ink-3 sm:sr-only">est. </span>
                <span className="sr-only">Estimated wait </span>
                <span className="tnum">{formatEstimate(est)}</span>
              </p>
            </div>

            <div className="col-start-4 row-start-1 flex items-center gap-0.5 sm:col-start-6 sm:row-start-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={first}
                onClick={() => onMove(t, "up")}
                aria-label={`Move #${t.number} up`}
                title={first ? "Already first" : "Move up"}
              >
                <IconUp />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={last}
                onClick={() => onMove(t, "down")}
                aria-label={`Move #${t.number} down`}
                title={last ? "Already last" : "Move down"}
              >
                <IconDown />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onCancel(t)}
                aria-label={`Cancel #${t.number}`}
                title="Cancel token (you can undo)"
              >
                <IconX />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
