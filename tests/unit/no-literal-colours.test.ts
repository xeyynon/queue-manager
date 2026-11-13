import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Playbook rule: every colour is a token in globals.css. Components never use
// literal hex/rgb/hsl colours, and never Tailwind palette colours (bg-blue-500...).
const SRC = path.resolve(__dirname, "../../src");
const files: string[] = [];
(function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
})(SRC);

// layout.tsx: the browser theme-color meta needs real hex values.
const ALLOWED = new Set([path.join(SRC, "app", "layout.tsx")]);
const LITERAL = /#[0-9a-fA-F]{3,8}\b(?![-\w])|rgba?\(\s*\d|hsla?\(\s*\d/;
const TW_PALETTE =
  /\b(?:bg|text|border|fill|stroke|outline|ring|decoration|divide)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?\b/;

describe("no literal colours in components", () => {
  it.each(files.filter((f) => !ALLOWED.has(f)).map((f) => [path.relative(SRC, f), f]))("%s", (_rel, file) => {
    const offenders = readFileSync(file, "utf8")
      .split("\n")
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => !line.trim().startsWith("//") && (LITERAL.test(line) || TW_PALETTE.test(line)))
      .map(({ line, n }) => `${n}: ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
