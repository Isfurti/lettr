import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";

import { applyStripeEvent } from "@/lib/billing-webhook-handler";
import { createUser, getUserById, getUserByStripeCustomerId } from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

function fakeEvent<T>(type: string, object: T): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event;
}

describe("applyStripeEvent", () => {
  it("checkout.session.completed upgrades the user to pro and stores the customer id", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `webhook-${userId}@example.com`, passwordHash: "x" });
    const customerId = `cus_${randomUUID()}`;

    await applyStripeEvent(
      fakeEvent("checkout.session.completed", {
        metadata: { userId },
        client_reference_id: userId,
        customer: customerId,
        subscription: "sub_123",
      })
    );

    const user = await getUserById(userId);
    expect(user?.plan).toBe("pro");
    expect(user?.stripe_customer_id).toBe(customerId);
    expect(user?.stripe_subscription_id).toBe("sub_123");
  });

  it("customer.subscription.updated with active status keeps user on pro", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `webhook-${userId}@example.com`, passwordHash: "x" });
    const customerId = `cus_${randomUUID()}`;

    // simulate they already checked out once
    await applyStripeEvent(
      fakeEvent("checkout.session.completed", {
        metadata: { userId },
        customer: customerId,
        subscription: "sub_abc",
      })
    );

    await applyStripeEvent(
      fakeEvent("customer.subscription.updated", {
        id: "sub_abc",
        customer: customerId,
        status: "active",
      })
    );

    const user = await getUserById(userId);
    expect(user?.plan).toBe("pro");
  });

  it("customer.subscription.updated with canceled status downgrades user to free", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `webhook-${userId}@example.com`, passwordHash: "x" });
    const customerId = `cus_${randomUUID()}`;

    await applyStripeEvent(
      fakeEvent("checkout.session.completed", {
        metadata: { userId },
        customer: customerId,
        subscription: "sub_xyz",
      })
    );

    await applyStripeEvent(
      fakeEvent("customer.subscription.updated", {
        id: "sub_xyz",
        customer: customerId,
        status: "canceled",
      })
    );

    const user = await getUserById(userId);
    expect(user?.plan).toBe("free");
  });

  it("customer.subscription.deleted downgrades the user to free", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `webhook-${userId}@example.com`, passwordHash: "x" });
    const customerId = `cus_${randomUUID()}`;

    await applyStripeEvent(
      fakeEvent("checkout.session.completed", {
        metadata: { userId },
        customer: customerId,
        subscription: "sub_del",
      })
    );

    await applyStripeEvent(
      fakeEvent("customer.subscription.deleted", {
        id: "sub_del",
        customer: customerId,
      })
    );

    const user = await getUserById(userId);
    expect(user?.plan).toBe("free");
  });

  it("ignores events for unknown customer ids without throwing", async () => {
    await expect(
      applyStripeEvent(
        fakeEvent("customer.subscription.updated", {
          id: "sub_ghost",
          customer: `cus_${randomUUID()}`,
          status: "active",
        })
      )
    ).resolves.not.toThrow();
  });

  it("is a no-op for unhandled event types", async () => {
    await expect(applyStripeEvent(fakeEvent("invoice.paid", {}))).resolves.not.toThrow();
  });

  it("invoice.payment_failed does not throw, even for an unknown customer", async () => {
    await expect(
      applyStripeEvent(
        fakeEvent("invoice.payment_failed", {
          id: "in_test",
          customer: `cus_${randomUUID()}`,
          amount_due: 2900,
          attempt_count: 1,
        })
      )
    ).resolves.not.toThrow();
  });

  it("invoice.payment_failed does not change the user's plan", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `webhook-${userId}@example.com`, passwordHash: "x" });
    const customerId = `cus_${randomUUID()}`;

    await applyStripeEvent(
      fakeEvent("checkout.session.completed", {
        metadata: { userId },
        customer: customerId,
        subscription: "sub_failtest",
      })
    );

    await applyStripeEvent(
      fakeEvent("invoice.payment_failed", {
        id: "in_test2",
        customer: customerId,
        amount_due: 2900,
        attempt_count: 1,
      })
    );

    const user = await getUserById(userId);
    expect(user?.plan).toBe("pro"); // failed payment alone doesn't downgrade - Stripe retries first
  });

  it("looks up a user correctly by stripe customer id", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `webhook-${userId}@example.com`, passwordHash: "x" });
    const customerId = `cus_${randomUUID()}`;

    await applyStripeEvent(
      fakeEvent("checkout.session.completed", {
        metadata: { userId },
        customer: customerId,
        subscription: "sub_lookup",
      })
    );

    const found = await getUserByStripeCustomerId(customerId);
    expect(found?.id).toBe(userId);
  });
});
