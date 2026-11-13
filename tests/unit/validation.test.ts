import { describe, expect, it } from "vitest";
import { safeTimeZone } from "@/lib/timezone";
import { queueNameSchema, tokenLabelSchema } from "@/lib/validation";

describe("queueNameSchema", () => {
  it("trims and collapses whitespace", () => {
    expect(queueNameSchema.parse("  General   OPD ")).toBe("General OPD");
  });
  it("rejects empty and over-long names", () => {
    expect(queueNameSchema.safeParse("   ").success).toBe(false);
    expect(queueNameSchema.safeParse("x".repeat(61)).success).toBe(false);
    expect(queueNameSchema.safeParse("x".repeat(60)).success).toBe(true);
  });
});

describe("tokenLabelSchema", () => {
  it("turns blank into null", () => {
    expect(tokenLabelSchema.parse("   ")).toBeNull();
    expect(tokenLabelSchema.parse(" Ravi  K ")).toBe("Ravi K");
  });
});

describe("safeTimeZone", () => {
  it("accepts real zones, including legacy aliases browsers report", () => {
    expect(safeTimeZone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(safeTimeZone("Asia/Calcutta")).toBe("Asia/Calcutta");
    expect(safeTimeZone("UTC")).toBe("UTC");
  });
  it("falls back to UTC for junk or injection attempts", () => {
    expect(safeTimeZone(null)).toBe("UTC");
    expect(safeTimeZone("Mars/Olympus")).toBe("UTC");
    expect(safeTimeZone("UTC'; drop table x;--")).toBe("UTC");
  });
});
