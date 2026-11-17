import { describe, expect, it, vi } from "vitest";
import { PublicError, publicMessage } from "@/lib/public-error";
import { extractTextFromFile } from "@/lib/extract-text";

vi.mock("@/lib/db", () => ({
  default: { query: async () => { throw new Error('password authentication failed for user "neondb_owner" at ep-secret-host.neon.tech'); } },
}));

describe("publicMessage", () => {
  it("shows messages written for people and hides everything else", () => {
    expect(publicMessage(new PublicError("Please try again."), "x")).toBe("Please try again.");
    expect(publicMessage(new Error("ANTHROPIC_API_KEY is not set"), "AI generation failed")).toBe("AI generation failed");
    expect(publicMessage("a string", "fallback")).toBe("fallback");
    expect(publicMessage(undefined, "fallback")).toBe("fallback");
  });
});

describe("file reading errors", () => {
  it("a corrupt Word file gives a friendly message, not the parser's", async () => {
    const err = await extractTextFromFile(Buffer.from("not really a zip"), "cv.docx").catch((e) => e);
    expect(err).toBeInstanceOf(PublicError);
    expect(err.message).toMatch(/Word file/);
  });
  it("an unsupported type is still explained", async () => {
    const err = await extractTextFromFile(Buffer.from("x"), "cv.exe").catch((e) => e);
    expect(err).toBeInstanceOf(PublicError);
  });
});

describe("health endpoint", () => {
  it("says the database is down without repeating the database's own error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("disconnected");
    expect(text).not.toMatch(/neondb_owner|ep-secret|password/);
  });
});
