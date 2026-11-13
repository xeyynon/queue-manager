// Measures WCAG contrast for every text/background token pair, in both themes,
// straight from src/app/globals.css. Exits 1 if any pair is below its minimum.
//   node scripts/contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function block(selectorRegex) {
  const m = css.match(selectorRegex);
  if (!m) throw new Error("block not found: " + selectorRegex);
  const vars = {};
  for (const [, k, v] of m[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) vars[k] = v;
  return vars;
}
const light = block(/:root\s*\{([^}]*)\}/);
const dark = block(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/);

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum] - 4.5 for text, 3 for large/graphic marks.
const PAIRS = [
  ["ink", "bg", 4.5], ["ink", "surface", 4.5], ["ink", "surface-2", 4.5],
  ["ink-2", "bg", 4.5], ["ink-2", "surface", 4.5], ["ink-2", "surface-2", 4.5],
  ["ink-3", "bg", 4.5], ["ink-3", "surface", 4.5], ["ink-3", "surface-2", 4.5],
  ["on-accent", "accent", 4.5], ["on-accent", "accent-hover", 4.5],
  ["accent", "surface", 4.5], ["accent", "bg", 4.5],
  ["warn-ink", "surface", 4.5], ["warn-ink", "bg", 4.5],
  ["danger-ink", "surface", 4.5], ["danger-ink", "surface-2", 4.5],
  ["ok-ink", "surface", 4.5],
  ["bg", "ink", 4.5], // toasts: page colour on ink
  ["chart-a", "surface", 3], ["chart-b", "surface", 3], ["chart-line", "surface", 3],
  ["focus", "bg", 3], ["focus", "surface", 3],
];

let failed = 0;
for (const [name, t] of [["light", light], ["dark", dark]]) {
  console.log(`\n${name}`);
  for (const [fg, bg, min] of PAIRS) {
    if (!t[fg] || !t[bg]) throw new Error(`missing token ${fg} or ${bg} in ${name}`);
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  --${fg} on --${bg}`);
  }
}
console.log(failed ? `\n${failed} pair(s) below minimum` : "\nAll pairs pass");
process.exit(failed ? 1 : 0);
