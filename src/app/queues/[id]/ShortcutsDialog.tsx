"use client";

import type { Ref } from "react";
import { Button } from "@/components/Button";

export const SHORTCUTS: [key: string, action: string][] = [
  ["A", "Add a token (uses the name field if filled)"],
  ["S", "Serve the token at the top"],
  ["?", "Show this list"],
  ["Esc", "Close this list"],
];

export function ShortcutsDialog({ ref }: { ref: Ref<HTMLDialogElement> }) {
  return (
    <dialog
      ref={ref}
      aria-labelledby="shortcuts-h"
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-md bg-surface p-5 text-ink backdrop:bg-ink/40"
      onClick={(e) => {
        // Close on backdrop click only (the press started on the dialog element itself).
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <h2 id="shortcuts-h" className="text-lg font-semibold">
        Keyboard shortcuts
      </h2>
      <p className="mt-1 text-sm text-ink-2">They work anywhere on the queue screen except while typing in a field.</p>
      <dl className="mt-4 grid grid-cols-[56px_1fr] gap-x-3 gap-y-2.5 text-sm">
        {SHORTCUTS.map(([k, a]) => (
          <div key={k} className="contents">
            <dt>
              <kbd className="num inline-flex h-7 min-w-7 items-center justify-center rounded-sm bg-surface-2 px-1.5 text-sm">{k}</kbd>
            </dt>
            <dd className="self-center text-ink-2">{a}</dd>
          </div>
        ))}
      </dl>
      <form method="dialog" className="mt-5 flex justify-end">
        <Button type="submit" variant="secondary">
          Close
        </Button>
      </form>
    </dialog>
  );
}
