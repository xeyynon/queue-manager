import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Formatting a clock time while server-rendering uses the server's zone
// (UTC on Vercel) and breaks hydration for viewers elsewhere. Clock times in
// server-rendered components go through <LocalTime>. Files listed here format
// dates only after a client-side fetch (nothing to format during SSR), or build
// dates from parts so the zone can't shift them.
const ALLOWED: Record<string, string> = {
  "components/LocalTime.tsx": "the one hydration-safe formatter",
  "app/dashboard/Dashboard.tsx": "updatedAt is null until the client fetch resolves",
  "app/dashboard/Charts.tsx": "renders only with data fetched on the client",
  "lib/format.ts": "bucketLabel builds a local date from Y-M-D parts",
};

const SRC = path.resolve(__dirname, "../../src");
const files: string[] = [];
(function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
})(SRC);

describe("no locale time formatting outside the hydration-safe places", () => {
  it.each(files.map((f) => [path.relative(SRC, f).replace(/[\\/]+/g, "/"), f]))("%s", (rel, file) => {
    const uses = /toLocale(Time|Date)?String\(/.test(readFileSync(file, "utf8"));
    if (uses) expect(Object.keys(ALLOWED), `${rel} formats a time; use <LocalTime> or add a reasoned exception`).toContain(rel);
  });
});
