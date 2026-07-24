import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { createSupportMessage, listSupportMessages, updateSupportMessageStatus } from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("support messages", () => {
  it("creates a message and it appears in the list, defaulting to open", async () => {
    const id = randomUUID();
    await createSupportMessage({
      id,
      userId: null,
      email: "user@example.com",
      subject: "Can't export PDF",
      message: "The button does nothing.",
    });

    const messages = await listSupportMessages();
    const found = messages.find((m) => m.id === id);
    expect(found).toBeDefined();
    expect(found?.status).toBe("open");
    expect(found?.email).toBe("user@example.com");
  });

  it("supports messages from anonymous users (null user_id)", async () => {
    const id = randomUUID();
    await createSupportMessage({
      id,
      userId: null,
      email: "anon@example.com",
      subject: "Question",
      message: "Hi",
    });
    const messages = await listSupportMessages();
    const found = messages.find((m) => m.id === id);
    expect(found?.user_id).toBeNull();
  });

  it("updates status to resolved", async () => {
    const id = randomUUID();
    await createSupportMessage({ id, userId: null, email: "x@example.com", subject: "S", message: "M" });
    await updateSupportMessageStatus(id, "resolved");

    const messages = await listSupportMessages();
    const found = messages.find((m) => m.id === id);
    expect(found?.status).toBe("resolved");
  });

  it("lists messages most recent first", async () => {
    const id1 = randomUUID();
    await createSupportMessage({ id: id1, userId: null, email: "a@example.com", subject: "First", message: "M" });
    const id2 = randomUUID();
    await createSupportMessage({ id: id2, userId: null, email: "b@example.com", subject: "Second", message: "M" });

    const messages = await listSupportMessages();
    const i1 = messages.findIndex((m) => m.id === id1);
    const i2 = messages.findIndex((m) => m.id === id2);
    expect(i2).toBeLessThan(i1); // second created appears first (DESC order)
  });
});
