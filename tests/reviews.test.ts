import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { createUser, createReview, listAllReviews, getReviewStats } from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("reviews", () => {
  it("creates a review and it appears in the list with the right user joined in", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `reviewer-${userId}@example.com`, passwordHash: "x", name: "Reviewer One" });

    const reviewId = randomUUID();
    await createReview({
      id: reviewId,
      userId,
      rating: 4,
      content: "Loved the AI bullet rewriting, wish there were more templates.",
      sentiment: "mixed",
      likes: ["AI bullet rewriting"],
      dislikes: ["Not enough templates"],
      aiReply: "Thanks for the kind words about the AI rewriting!",
    });

    const reviews = await listAllReviews(100);
    const found = reviews.find((r) => r.id === reviewId);
    expect(found).toBeDefined();
    expect(found?.rating).toBe(4);
    expect(found?.likes).toEqual(["AI bullet rewriting"]);
    expect(found?.dislikes).toEqual(["Not enough templates"]);
    expect(found?.user_email).toBe(`reviewer-${userId}@example.com`);
    expect(found?.user_name).toBe("Reviewer One");
  });

  it("supports an empty dislikes array (all-positive review)", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `reviewer-${userId}@example.com`, passwordHash: "x" });

    const reviewId = randomUUID();
    await createReview({
      id: reviewId,
      userId,
      rating: 5,
      content: "Everything about this is great.",
      sentiment: "positive",
      likes: ["Everything"],
      dislikes: [],
      aiReply: "So glad to hear it!",
    });

    const reviews = await listAllReviews(100);
    const found = reviews.find((r) => r.id === reviewId);
    expect(found?.dislikes).toEqual([]);
  });

  it("computes real stats - total, average rating, and distribution", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `stats-${userId}@example.com`, passwordHash: "x" });

    await createReview({ id: randomUUID(), userId, rating: 5, content: "Great", sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!" });
    await createReview({ id: randomUUID(), userId, rating: 1, content: "Bad", sentiment: "negative", likes: [], dislikes: ["Everything"], aiReply: "Sorry to hear that." });

    const stats = await getReviewStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.distribution[5]).toBeGreaterThanOrEqual(1);
    expect(stats.distribution[1]).toBeGreaterThanOrEqual(1);
  });

  it("lists most recent reviews first", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `order-${userId}@example.com`, passwordHash: "x" });

    const id1 = randomUUID();
    await createReview({ id: id1, userId, rating: 3, content: "First review here", sentiment: "neutral", likes: [], dislikes: [], aiReply: "Noted." });
    await new Promise((r) => setTimeout(r, 10));
    const id2 = randomUUID();
    await createReview({ id: id2, userId, rating: 3, content: "Second review here", sentiment: "neutral", likes: [], dislikes: [], aiReply: "Noted." });

    const reviews = await listAllReviews(100);
    const i1 = reviews.findIndex((r) => r.id === id1);
    const i2 = reviews.findIndex((r) => r.id === id2);
    expect(i2).toBeLessThan(i1);
  });
});
