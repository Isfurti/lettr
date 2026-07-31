import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { createUser, createReview, listAllReviews, getReviewStats, setReviewFeatured, getFeaturedReviews } from "@/lib/db";
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
      consentToFeature: true,
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
      consentToFeature: false,
    });

    const reviews = await listAllReviews(100);
    const found = reviews.find((r) => r.id === reviewId);
    expect(found?.dislikes).toEqual([]);
  });

  it("computes real stats - total, average rating, and distribution", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `stats-${userId}@example.com`, passwordHash: "x" });

    await createReview({ id: randomUUID(), userId, rating: 5, content: "Great", sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!", consentToFeature: false });
    await createReview({ id: randomUUID(), userId, rating: 1, content: "Bad", sentiment: "negative", likes: [], dislikes: ["Everything"], aiReply: "Sorry to hear that.", consentToFeature: false });

    const stats = await getReviewStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.distribution[5]).toBeGreaterThanOrEqual(1);
    expect(stats.distribution[1]).toBeGreaterThanOrEqual(1);
  });

  it("lists most recent reviews first", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `order-${userId}@example.com`, passwordHash: "x" });

    const id1 = randomUUID();
    await createReview({ id: id1, userId, rating: 3, content: "First review here", sentiment: "neutral", likes: [], dislikes: [], aiReply: "Noted.", consentToFeature: false });
    await new Promise((r) => setTimeout(r, 10));
    const id2 = randomUUID();
    await createReview({ id: id2, userId, rating: 3, content: "Second review here", sentiment: "neutral", likes: [], dislikes: [], aiReply: "Noted.", consentToFeature: false });

    const reviews = await listAllReviews(100);
    const i1 = reviews.findIndex((r) => r.id === id1);
    const i2 = reviews.findIndex((r) => r.id === id2);
    expect(i2).toBeLessThan(i1);
  });
});

describe("review consent enforcement - the privacy-critical part", () => {
  it("refuses to feature a review the user did not consent to", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `noconsent-${userId}@example.com`, passwordHash: "x" });

    const reviewId = randomUUID();
    await createReview({
      id: reviewId, userId, rating: 5, content: "Great product but this was private feedback.",
      sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!", consentToFeature: false,
    });

    const result = await setReviewFeatured(reviewId, true);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/did not consent/i);

    // Confirm it's genuinely not featured in the DB, not just an error message
    const reviews = await listAllReviews(100);
    const found = reviews.find((r) => r.id === reviewId);
    expect(found?.featured).toBe(false);
  });

  it("allows featuring a review the user did consent to", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `consent-${userId}@example.com`, passwordHash: "x" });

    const reviewId = randomUUID();
    await createReview({
      id: reviewId, userId, rating: 5, content: "Loved it, happy to have this shared publicly.",
      sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!", consentToFeature: true,
    });

    const result = await setReviewFeatured(reviewId, true);
    expect(result.ok).toBe(true);

    const reviews = await listAllReviews(100);
    expect(reviews.find((r) => r.id === reviewId)?.featured).toBe(true);
  });

  it("getFeaturedReviews only returns reviews that are BOTH featured AND consented", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `mixed-${userId}@example.com`, passwordHash: "x" });

    // Consented + featured - should appear
    const shownId = randomUUID();
    await createReview({
      id: shownId, userId, rating: 5, content: "This one should be publicly visible.",
      sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!", consentToFeature: true,
    });
    await setReviewFeatured(shownId, true);

    // Consented but NOT featured (admin hasn't approved it) - should NOT appear
    const notFeaturedId = randomUUID();
    await createReview({
      id: notFeaturedId, userId, rating: 5, content: "Consented but admin never approved this one.",
      sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!", consentToFeature: true,
    });

    const featured = await getFeaturedReviews(100);
    const shownIds = featured.map((r) => r.id);
    expect(shownIds).toContain(shownId);
    expect(shownIds).not.toContain(notFeaturedId);
  });

  it("a review with no consent can never appear in getFeaturedReviews, even if featured were somehow set true directly", async () => {
    // This simulates a hypothetical bug/direct DB write bypassing
    // setReviewFeatured's guard, to prove getFeaturedReviews itself has an
    // independent, redundant consent check - not just relying on the one
    // guard in setReviewFeatured.
    const userId = randomUUID();
    await createUser({ id: userId, email: `bypass-${userId}@example.com`, passwordHash: "x" });

    const reviewId = randomUUID();
    await createReview({
      id: reviewId, userId, rating: 5, content: "Never consented to this being public.",
      sentiment: "positive", likes: [], dislikes: [], aiReply: "Thanks!", consentToFeature: false,
    });

    // Bypass the guard directly at the SQL level
    await pool.query("UPDATE reviews SET featured = true WHERE id = $1", [reviewId]);

    const featured = await getFeaturedReviews(100);
    expect(featured.map((r) => r.id)).not.toContain(reviewId);
  });
});
