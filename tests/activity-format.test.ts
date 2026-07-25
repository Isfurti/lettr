import { describe, it, expect } from "vitest";
import { formatActivityLabel, timeAgo } from "@/lib/activity-format";

describe("formatActivityLabel", () => {
  it("maps known actions to friendly labels", () => {
    expect(formatActivityLabel("resume_created").title).toBe("Resume created");
    expect(formatActivityLabel("pdf_exported").title).toBe("PDF exported");
    expect(formatActivityLabel("docx_exported").title).toBe("DOCX exported");
    expect(formatActivityLabel("ai_polish_applied").title).toBe("AI polish applied");
  });

  it("falls back gracefully for unknown actions", () => {
    const result = formatActivityLabel("some_new_action");
    expect(result.title).toBe("some new action");
  });
});

describe("timeAgo", () => {
  it("shows 'just now' for very recent timestamps", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });

  it("shows minutes for recent timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("shows hours for older timestamps", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("shows days for timestamps older than a day", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });
});
