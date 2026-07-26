import { describe, it, expect } from "vitest";
import { darkenHex, softenHex, getFontPair, FONT_PAIRS } from "@/lib/customization";

describe("darkenHex", () => {
  it("darkens a color, producing a smaller RGB sum", () => {
    const original = "#b8862e";
    const darkened = darkenHex(original, 0.25);
    const sum = (hex: string) => {
      const n = parseInt(hex.replace("#", ""), 16);
      return ((n >> 16) & 0xff) + ((n >> 8) & 0xff) + (n & 0xff);
    };
    expect(sum(darkened)).toBeLessThan(sum(original));
  });

  it("returns a valid 6-digit hex string", () => {
    expect(darkenHex("#1e3a5f")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("never goes below 0 for very dark inputs", () => {
    const result = darkenHex("#000000", 0.5);
    expect(result).toBe("#000000");
  });
});

describe("softenHex", () => {
  it("lightens a color toward white, producing a larger RGB sum", () => {
    const original = "#b8862e";
    const softened = softenHex(original, 0.85);
    const sum = (hex: string) => {
      const n = parseInt(hex.replace("#", ""), 16);
      return ((n >> 16) & 0xff) + ((n >> 8) & 0xff) + (n & 0xff);
    };
    expect(sum(softened)).toBeGreaterThan(sum(original));
  });

  it("returns a valid 6-digit hex string", () => {
    expect(softenHex("#7a2e3a")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("getFontPair", () => {
  it("returns the matching font pair by id", () => {
    expect(getFontPair("elegant")?.id).toBe("elegant");
  });

  it("falls back to the first pair for an unknown id", () => {
    expect(getFontPair("nonexistent")?.id).toBe(FONT_PAIRS[0].id);
  });

  it("falls back to the first pair when no id is given", () => {
    expect(getFontPair(undefined)?.id).toBe(FONT_PAIRS[0].id);
  });
});
