import { describe, it, expect, afterAll, afterEach, beforeEach, vi } from "vitest";
import { createHmac, randomUUID } from "node:crypto";

// The billing routes check who is signed in; tests choose that user.
const signedIn = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/auth", () => ({
  auth: async () => (signedIn.userId ? { user: { id: signedIn.userId } } : null),
}));

import pool, {
  createUser,
  getUserById,
  createPaymentRecord,
  markPaymentPaid,
  expireLapsedPro,
  listProEndingSoon,
  updateUserPlan,
} from "@/lib/db";
import { verifyPaymentSignature, verifyWebhookSignature, currencyAllowed } from "@/lib/razorpay";
import { hasPaidPro, passAmountMinor, proHasLapsed } from "@/lib/pro-pass";
import { REGION_PRICES } from "@/lib/plans";
import { POST as checkout } from "@/app/api/billing/checkout/route";
import { POST as verify } from "@/app/api/billing/verify/route";
import { POST as webhook } from "@/app/api/billing/webhook/route";

afterAll(async () => {
  await pool.end();
});

beforeEach(() => {
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_key");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "test_secret");
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "hook_secret");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("COMPANY_GSTIN", "off");
});
afterEach(() => {
  signedIn.userId = null;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function newUser(countryCode = "IN") {
  const id = randomUUID();
  await createUser({ id, email: `pay-${id}@example.com`, passwordHash: "x", countryCode, pricingTier: "value" });
  return (await getUserById(id))!;
}

const sign = (secret: string, text: string) => createHmac("sha256", secret).update(text).digest("hex");
const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

/** Fakes Razorpay's "create order" API and records what was sent. */
function fakeRazorpay() {
  const sent: { amount: number; currency: string; notes: Record<string, string> }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      sent.push(body);
      return new Response(JSON.stringify({ id: `order_${randomUUID().slice(0, 12)}`, amount: body.amount, currency: body.currency, status: "created" }), { status: 200 });
    })
  );
  return sent;
}

describe("Pro pass pricing", () => {
  it("charges the India prices in paise", () => {
    expect(passAmountMinor(REGION_PRICES.IN, "monthly")).toBe(59900);
    expect(passAmountMinor(REGION_PRICES.IN, "quarter")).toBe(149900);
    expect(passAmountMinor(REGION_PRICES.IN, "yearly")).toBe(499900);
  });

  it("only takes rupees until international payments are switched on", () => {
    expect(currencyAllowed("INR", {})).toBe(true);
    expect(currencyAllowed("USD", {})).toBe(false);
    expect(currencyAllowed("USD", { RAZORPAY_INTERNATIONAL: "on" })).toBe(true);
  });
});

describe("Razorpay signatures", () => {
  it("accepts the checkout signature Razorpay makes and rejects anything else", () => {
    const signature = sign("s3cret", "order_1|pay_1");
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature, secret: "s3cret" })).toBe(true);
    expect(verifyPaymentSignature({ orderId: "order_2", paymentId: "pay_1", signature, secret: "s3cret" })).toBe(false);
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature: "nope", secret: "s3cret" })).toBe(false);
  });

  it("checks webhook bodies against the webhook secret", () => {
    const body = '{"event":"order.paid"}';
    expect(verifyWebhookSignature(body, sign("hook", body), "hook")).toBe(true);
    expect(verifyWebhookSignature(body + " ", sign("hook", body), "hook")).toBe(false);
    expect(verifyWebhookSignature(body, null, "hook")).toBe(false);
  });
});

describe("paying for Pro", () => {
  it("adds the months once, even when checkout and webhook both report the payment", async () => {
    const user = await newUser();
    const orderId = `order_${user.id}`;
    await createPaymentRecord({ orderId, userId: user.id, planId: "quarter", months: 3, amount: 149900, currency: "INR" });

    const first = await markPaymentPaid(orderId, `pay_a_${user.id}`);
    expect(first?.user?.plan).toBe("pro");
    const end = new Date(first!.user!.pro_until as string);
    const days = (end.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(88);
    expect(days).toBeLessThan(93);

    expect(await markPaymentPaid(orderId, `pay_a_${user.id}`)).toBeNull();
    const after = await getUserById(user.id);
    expect(new Date(after!.pro_until as string).getTime()).toBe(end.getTime());
  });

  it("adds a new pass after the Pro time that's left", async () => {
    const user = await newUser();
    await createPaymentRecord({ orderId: `o1_${user.id}`, userId: user.id, planId: "monthly", months: 1, amount: 59900, currency: "INR" });
    const one = await markPaymentPaid(`o1_${user.id}`, `p1_${user.id}`);
    await createPaymentRecord({ orderId: `o2_${user.id}`, userId: user.id, planId: "monthly", months: 1, amount: 59900, currency: "INR" });
    const two = await markPaymentPaid(`o2_${user.id}`, `p2_${user.id}`);
    const gap = new Date(two!.user!.pro_until as string).getTime() - new Date(one!.user!.pro_until as string).getTime();
    expect(gap / 86_400_000).toBeGreaterThan(27);
  });

  it("moves people back to Free when their pass runs out, but never comped Pro", async () => {
    const paid = await newUser();
    const comped = await newUser();
    await updateUserPlan({ userId: comped.id, plan: "pro" });
    await pool.query("UPDATE users SET plan = 'pro', pro_until = now() - interval '1 hour' WHERE id = $1", [paid.id]);

    // Loading the user is enough to apply it...
    expect((await getUserById(paid.id))!.plan).toBe("free");
    expect((await getUserById(comped.id))!.plan).toBe("pro");
    expect(hasPaidPro({ plan: "pro", pro_until: null })).toBe(false);
    expect(proHasLapsed({ plan: "pro", pro_until: new Date(Date.now() + 60_000) })).toBe(false);

    // ...and the daily job does it for everyone.
    await pool.query("UPDATE users SET plan = 'pro', pro_until = now() - interval '1 hour' WHERE id = $1", [paid.id]);
    expect(await expireLapsedPro()).toBeGreaterThanOrEqual(1);
    const { rows } = await pool.query("SELECT plan FROM users WHERE id = $1", [paid.id]);
    expect(rows[0].plan).toBe("free");
  });

  it("finds passes ending in the next few days for the reminder email", async () => {
    const user = await newUser();
    await pool.query("UPDATE users SET plan = 'pro', pro_until = now() + interval '2 days' WHERE id = $1", [user.id]);
    expect((await listProEndingSoon(3)).some((u) => u.id === user.id)).toBe(true);
    await pool.query("UPDATE users SET pro_reminder_sent_for = pro_until WHERE id = $1", [user.id]);
    expect((await listProEndingSoon(3)).some((u) => u.id === user.id)).toBe(false);
  });
});

describe("checkout routes", () => {
  it("makes an order for the server's price, not one sent by the browser", async () => {
    const user = await newUser();
    signedIn.userId = user.id;
    const sent = fakeRazorpay();
    const res = await checkout(json({ plan: "quarter", amount: 1 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keyId).toBe("rzp_test_key");
    expect(sent[0].amount).toBe(149900);
    expect(sent[0].currency).toBe("INR");
    expect(sent[0].notes.userId).toBe(user.id);
  });

  it("asks people to sign in, and refuses unknown plans and non-India prices for now", async () => {
    expect((await checkout(json({ plan: "quarter" }))).status).toBe(401);
    const user = await newUser("US");
    signedIn.userId = user.id;
    fakeRazorpay();
    expect((await checkout(json({ plan: "lifetime" }))).status).toBe(400);
    expect((await checkout(json({ plan: "monthly" }))).status).toBe(403);
  });

  it("says payments are unavailable instead of failing when Razorpay isn't set up", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    const user = await newUser();
    signedIn.userId = user.id;
    expect((await checkout(json({ plan: "monthly" }))).status).toBe(503);
  });

  it("switches Pro on after a correctly signed payment, and only for the buyer", async () => {
    const user = await newUser();
    const other = await newUser();
    const orderId = `order_v_${user.id}`;
    await createPaymentRecord({ orderId, userId: user.id, planId: "monthly", months: 1, amount: 59900, currency: "INR" });
    const paymentId = `pay_v_${user.id}`;
    const payload = { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sign("test_secret", `${orderId}|${paymentId}`) };

    signedIn.userId = other.id;
    expect((await verify(json(payload))).status).toBe(404);

    signedIn.userId = user.id;
    expect((await verify(json({ ...payload, razorpay_signature: "forged" }))).status).toBe(400);
    expect((await getUserById(user.id))!.plan).toBe("free");

    expect((await verify(json(payload))).status).toBe(200);
    expect((await getUserById(user.id))!.plan).toBe("pro");
  });

  it("switches Pro on from the webhook if the buyer closed the page first", async () => {
    const user = await newUser();
    const orderId = `order_w_${user.id}`;
    await createPaymentRecord({ orderId, userId: user.id, planId: "yearly", months: 12, amount: 499900, currency: "INR" });
    const raw = JSON.stringify({ event: "order.paid", payload: { payment: { entity: { id: `pay_w_${user.id}`, order_id: orderId } } } });

    expect((await webhook(new Request("http://localhost/api", { method: "POST", body: raw, headers: { "x-razorpay-signature": "bad" } }))).status).toBe(400);
    const res = await webhook(new Request("http://localhost/api", { method: "POST", body: raw, headers: { "x-razorpay-signature": sign("hook_secret", raw) } }));
    expect(res.status).toBe(200);
    const after = await getUserById(user.id);
    expect(after!.plan).toBe("pro");
    expect(after!.pro_plan).toBe("yearly");
  });
});
