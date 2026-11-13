import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Dark mode is declared twice (OS preference + explicit toggle). They must never drift.
const css = readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");
const vars = (body: string) => Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

describe("theme tokens", () => {
  const light = vars(css.match(/:root\s*\{([^}]*)\}/)![1]);
  const darkMedia = vars(css.match(/:root:not\(\[data-theme="light"\]\)\s*\{([^}]*)\}/)![1]);
  const darkToggle = vars(css.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)![1]);

  it("OS-dark and toggle-dark blocks are identical", () => expect(darkMedia).toEqual(darkToggle));
  it("dark mode defines every token light mode defines", () => {
    expect(Object.keys(darkToggle).sort()).toEqual(Object.keys(light).sort());
  });
});
