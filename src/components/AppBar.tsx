"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import { IconChart, IconMenu } from "./Icons";

type Theme = "auto" | "light" | "dark";
export const BUILD = "Build 1000";

function readTheme(): Theme {
  try {
    const t = localStorage.getItem("qm-theme");
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

// Theme lives in localStorage + <html data-theme>; this tiny store lets React read it
// without a hydration mismatch (server snapshot is "auto").
const themeListeners = new Set<() => void>();
const subscribeTheme = (cb: () => void) => {
  themeListeners.add(cb);
  return () => themeListeners.delete(cb);
};

function applyTheme(t: Theme) {
  try {
    if (t === "auto") localStorage.removeItem("qm-theme");
    else localStorage.setItem("qm-theme", t);
  } catch {
    /* storage blocked: still apply for this page view */
  }
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  themeListeners.forEach((l) => l());
}

export function AppBar({
  userName,
  current,
  isDemo = false,
}: {
  userName: string;
  current?: "queues" | "dashboard";
  isDemo?: boolean;
}) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "auto" as Theme);
  const [signingOut, setSigningOut] = useState(false);

  const navClass = (active: boolean) =>
    `inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium underline-offset-[6px] pointer-coarse:h-11 ${
      active ? "text-ink underline decoration-2 decoration-accent" : "text-ink-2 hover:text-ink"
    }`;

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut().catch(() => undefined);
    // Full page load on purpose: drops every bit of client state from the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <>
      {/* Outside the sticky header: it is read once and scrolls away, so on a phone it
          doesn't sit on top of the queue all day (audit A-06). Flat strip, no inverted band. */}
      {isDemo ? (
        <p className="bg-surface-2 px-4 py-1.5 text-center text-sm text-ink-2">
          <strong className="font-semibold text-ink">Sample data:</strong> this demo account&rsquo;s history is simulated.
          <span className="hidden sm:inline"> Sign up for an empty account to use it for real.</span>
        </p>
      ) : null}
    <header className="sticky top-0 z-20 bg-bg">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
        <Link href="/queues" className="justify-self-start text-[15px] font-semibold tracking-tight text-ink">
          Queue&nbsp;Manager
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link href="/queues" aria-current={current === "queues" ? "page" : undefined} className={navClass(current === "queues")}>
            Queues
          </Link>
          <Link href="/dashboard" aria-current={current === "dashboard" ? "page" : undefined} className={navClass(current === "dashboard")}>
            <IconChart />
            Dashboard
          </Link>
        </nav>
        <div className="justify-self-end">
          <button
            type="button"
            popoverTarget="app-menu"
            className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink pointer-coarse:h-11"
            aria-label={`Menu for ${userName}`}
          >
            <span className="hidden max-w-40 truncate sm:inline">{userName}</span>
            <IconMenu />
          </button>
          <div
            id="app-menu"
            popover="auto"
            className="fixed inset-auto top-14 right-4 m-0 w-64 rounded-md bg-surface p-2 text-ink shadow-[var(--shadow-pop)]"
          >
            <p className="truncate px-2 pt-1 pb-2 text-sm text-ink-3">Signed in as {userName}</p>
            <fieldset className="px-2 pb-2">
              <legend className="pb-1.5 text-xs font-medium text-ink-2">Theme</legend>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1">
                {(["auto", "light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={theme === t}
                    onClick={() => applyTheme(t)}
                    className="h-8 rounded-sm text-sm capitalize text-ink-2 aria-pressed:bg-surface aria-pressed:font-medium aria-pressed:text-ink pointer-coarse:h-10"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              onClick={signOut}
              aria-busy={signingOut || undefined}
              className="flex h-9 w-full items-center rounded-sm px-2 text-left text-sm text-ink hover:bg-surface-2 pointer-coarse:h-11"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
            <p className="px-2 pt-2 text-xs text-ink-3">{BUILD}</p>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
