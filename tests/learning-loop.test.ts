import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, recordAiFeedback, getAiFeedbackSummary, deleteAiExamplesForUser, deleteUserAccount, setAiImprovementConsent, getUserById } from "@/lib/db";
import { anonymize } from "@/lib/anonymize";

afterAll(async () => {
  await pool.end();
});

describe("anonymize", () => {
  it("removes contact details, the person's name and employers", () => {
    const out = anonymize("Priya Sharma at Freshworks (priya@x.com, +91 98765 43210, linkedin.com/in/p and https://p.dev) grew Freshworks sales; Priya led it", {
      names: ["Priya Sharma"],
      companies: ["Freshworks"],
    });
    expect(out).not.toMatch(/Priya|Sharma|Freshworks|priya@x\.com|98765|https:\/\/p\.dev/);
    expect(out).toContain("[name]");
    expect(out).toContain("[company]");
    expect(out).toContain("[email]");
    expect(out).toContain("[phone]");
  });
});

describe("AI feedback", () => {
  it("counts actions and deletes examples on opt-out and account deletion", async () => {
    const id = randomUUID();
    await createUser({ id, email: `ll-${id}@example.com`, passwordHash: "x", name: "LL" });
    expect((await getUserById(id))?.ai_improvement_consent).toBe(false);
    await setAiImprovementConsent(id, true);
    const feature = `t-${id.slice(0, 6)}`;
    const since = new Date(Date.now() - 60_000);
    await recordAiFeedback({ userId: id, feature, action: "kept", suggestionText: "Led launches" });
    await recordAiFeedback({ userId: id, feature, action: "edited", suggestionText: "Led launches", finalText: "Led 4 launches" });
    await recordAiFeedback({ userId: id, feature, action: "rejected" });
    expect((await getAiFeedbackSummary(since)).find((r) => r.feature === feature)).toMatchObject({ kept: 1, edited: 1, rejected: 1, examples: 2 });
    await deleteAiExamplesForUser(id);
    expect((await getAiFeedbackSummary(since)).find((r) => r.feature === feature)?.examples).toBe(0);
    await recordAiFeedback({ userId: id, feature, action: "kept", suggestionText: "x" });
    await deleteUserAccount(id);
    const left = await pool.query("SELECT COUNT(*)::int AS n FROM ai_feedback_events WHERE feature = $1 AND suggestion_text IS NOT NULL", [feature]);
    expect(left.rows[0].n).toBe(0);
  });
});
