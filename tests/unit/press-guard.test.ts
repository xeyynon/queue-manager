import { describe, expect, it } from "vitest";
import { createPressGuard } from "@/lib/press-guard";

describe("createPressGuard", () => {
  it("accepts the first press and rejects a double-click", () => {
    const accept = createPressGuard(600);
    expect(accept(1000)).toBe(true);
    expect(accept(1120)).toBe(false); // 120 ms later: same press
  });
  it("accepts a deliberate second press after the window", () => {
    const accept = createPressGuard(600);
    expect(accept(1000)).toBe(true);
    expect(accept(1700)).toBe(true);
  });
  it("measures the window from the last accepted press", () => {
    const accept = createPressGuard(600);
    accept(0);
    accept(300); // rejected
    expect(accept(650)).toBe(true);
  });
});
