import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Audit A-01 (2026-11-15): fields drawn only as a recessed fill were 1.1-1.25:1
// against the page. Every <input>, <select> and <textarea> needs a visible edge
// (`border-field-line`, >= 3:1, measured by scripts/contrast.mjs), WCAG 1.4.11.
const SRC = path.resolve(__dirname, "../../src");
const files: string[] = [];
(function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".tsx")) files.push(p);
  }
})(SRC);

// The opening tag of each field: up to "/>" or a ">" on its own line. Not [^>]*,
// which stops at the "=>" of an onChange arrow and misses a className after it.
const FIELD = /<(input|select|textarea)\b[\s\S]*?(?:\/>|\n\s*>)/g;

describe("every form field has a visible edge", () => {
  it.each(files.map((f) => [path.relative(SRC, f), f]))("%s", (_rel, file) => {
    const src = readFileSync(file, "utf8");
    const missing = [...src.matchAll(FIELD)]
      .filter((m) => !/type="(hidden|checkbox|radio)"/.test(m[0]) && !m[0].includes("border-field-line"))
      .map((m) => `line ${src.slice(0, m.index).split("\n").length}: <${m[1]}>`);
    expect(missing).toEqual([]);
  });

  it("finds the fields it guards (the regex still matches real code)", () => {
    const all = files.flatMap((f) => [...readFileSync(f, "utf8").matchAll(FIELD)]);
    expect(all.length).toBeGreaterThanOrEqual(3);
  });
});
