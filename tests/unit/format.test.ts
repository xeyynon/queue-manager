import { describe, expect, it } from "vitest";
import { bucketLabel, formatClock, formatDuration, formatEstimate, formatPercent } from "@/lib/format";

describe("formatDuration", () => {
  it.each([
    [0, "0 s"],
    [45.9, "45 s"],
    [60, "1 min"],
    [3599, "59 min"],
    [3600, "1 h 00 min"],
    [3900, "1 h 05 min"],
    [-5, "0 s"],
    [Number.NaN, "0 s"],
  ])("%s -> %s", (s, out) => expect(formatDuration(s)).toBe(out));
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [42, "0:42"],
    [725, "12:05"],
    [3729, "1:02:09"],
  ])("%s -> %s", (s, out) => expect(formatClock(s)).toBe(out));
});

describe("formatEstimate", () => {
  it("shows a dash when there is no estimate (never a made-up number)", () => expect(formatEstimate(null)).toBe("—"));
  it.each([
    [30, "< 1 min"],
    [89, "~1 min"],
    [360, "~6 min"],
    [4200, "~1 h 10 min"],
  ])("%s -> %s", (s, out) => expect(formatEstimate(s)).toBe(out));
});

describe("formatPercent", () => {
  it("dash for null, rounded percent otherwise", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(0.126)).toBe("13%");
  });
});

describe("bucketLabel", () => {
  it("labels hour buckets as a range, including midnight wrap", () => {
    expect(bucketLabel("2026-11-14T09:00", "hour")).toBe("09:00–10:00");
    expect(bucketLabel("2026-11-14T23:00", "hour")).toBe("23:00–00:00");
  });
  it("labels day buckets with the calendar date (no time-zone shift)", () => {
    expect(bucketLabel("2026-11-14T00:00", "day")).toMatch(/14/);
  });
});
