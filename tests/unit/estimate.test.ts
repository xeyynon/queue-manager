import { describe, expect, it } from "vitest";
import { estimateWaitSeconds, serviceIntervalSeconds } from "@/lib/estimate";

const NOW = Date.parse("2026-11-14T10:00:00Z");
const ago = (min: number) => new Date(NOW - min * 60_000).toISOString();

describe("serviceIntervalSeconds", () => {
  it("is null with fewer than 3 serves (no honest rate yet)", () => {
    expect(serviceIntervalSeconds([], NOW)).toBeNull();
    expect(serviceIntervalSeconds([ago(1), ago(5)], NOW)).toBeNull();
  });

  it("averages the gaps between recent serves", () => {
    // serves at -2, -6, -10 min: two 4-minute gaps
    expect(serviceIntervalSeconds([ago(2), ago(6), ago(10)], NOW)).toBe(240);
  });

  it("ignores serves older than 2 hours and future timestamps", () => {
    expect(serviceIntervalSeconds([ago(1), ago(3), ago(200), ago(300)], NOW)).toBeNull();
    expect(serviceIntervalSeconds([ago(-5), ago(1), ago(3)], NOW)).toBeNull();
  });

  it("uses at most the 10 most recent serves", () => {
    const recentFast = Array.from({ length: 10 }, (_, i) => ago(i)); // 1-min gaps
    const oldSlow = [ago(60), ago(100)];
    expect(serviceIntervalSeconds([...oldSlow, ...recentFast], NOW)).toBe(60);
  });

  it("is null when all serves share one instant (no span to divide)", () => {
    expect(serviceIntervalSeconds([ago(1), ago(1), ago(1)], NOW)).toBeNull();
  });
});

describe("estimateWaitSeconds", () => {
  it("is null without a rate", () => {
    expect(estimateWaitSeconds(1, null, null, NOW)).toBeNull();
  });
  it("grows by one interval per person ahead", () => {
    // last serve just now: top waits a full interval
    expect(estimateWaitSeconds(1, 300, ago(0), NOW)).toBe(300);
    expect(estimateWaitSeconds(3, 300, ago(0), NOW)).toBe(900);
  });
  it("subtracts time already spent on the current service, never below zero", () => {
    expect(estimateWaitSeconds(1, 300, ago(2), NOW)).toBe(180);
    expect(estimateWaitSeconds(1, 300, ago(10), NOW)).toBe(0);
    expect(estimateWaitSeconds(2, 300, ago(10), NOW)).toBe(300);
  });
});
