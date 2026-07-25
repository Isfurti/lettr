import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { createUser, logActivity, listRecentActivity } from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("activity log", () => {
  it("logs an action and it appears in recent activity", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `activity-${userId}@example.com`, passwordHash: "x" });

    await logActivity(userId, "resume_created", "My Resume");
    const activity = await listRecentActivity(userId);

    expect(activity).toHaveLength(1);
    expect(activity[0].action).toBe("resume_created");
    expect(activity[0].detail).toBe("My Resume");
  });

  it("returns most recent first", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `activity-${userId}@example.com`, passwordHash: "x" });

    await logActivity(userId, "resume_created", "First");
    await new Promise((r) => setTimeout(r, 10));
    await logActivity(userId, "pdf_exported", "Second");

    const activity = await listRecentActivity(userId);
    expect(activity[0].detail).toBe("Second");
    expect(activity[1].detail).toBe("First");
  });

  it("only returns activity for the given user, not other users", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    await createUser({ id: userA, email: `a-${userA}@example.com`, passwordHash: "x" });
    await createUser({ id: userB, email: `b-${userB}@example.com`, passwordHash: "x" });

    await logActivity(userA, "resume_created", "A's resume");
    await logActivity(userB, "resume_created", "B's resume");

    const activityA = await listRecentActivity(userA);
    expect(activityA).toHaveLength(1);
    expect(activityA[0].detail).toBe("A's resume");
  });

  it("respects the limit parameter", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `activity-${userId}@example.com`, passwordHash: "x" });

    for (let i = 0; i < 10; i++) {
      await logActivity(userId, "pdf_exported", `Export ${i}`);
    }

    const activity = await listRecentActivity(userId, 3);
    expect(activity).toHaveLength(3);
  });
});
