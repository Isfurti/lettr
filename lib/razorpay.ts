import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, called with plain fetch (no SDK). Needs RAZORPAY_KEY_ID and
 * RAZORPAY_KEY_SECRET; the webhook also needs RAZORPAY_WEBHOOK_SECRET.
 * Test keys (rzp_test_...) work the same way, without real money.
 */
const API = "https://api.razorpay.com/v1";

export function razorpayConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/**
 * Prices outside India are in other currencies, which Razorpay only accepts
 * once international payments are approved on the account. Until then only
 * INR checkouts are opened. Set RAZORPAY_INTERNATIONAL=on after approval.
 */
export function currencyAllowed(currency: string, env: Record<string, string | undefined> = process.env): boolean {
  return currency.toUpperCase() === "INR" || env.RAZORPAY_INTERNATIONAL?.trim().toLowerCase() === "on";
}

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to take payments.");
  return { keyId, secret };
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

export async function createOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, secret } = credentials();
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      receipt: params.receipt.slice(0, 40),
      notes: params.notes,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.id) {
    const reason = body?.error?.description ?? `HTTP ${res.status}`;
    throw new Error(`Razorpay couldn't create the order: ${reason}`);
  }
  return body as RazorpayOrder;
}

function safeEqualHex(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checks the signature Razorpay Checkout hands back after a payment. */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !params.signature) return false;
  const expected = createHmac("sha256", secret).update(`${params.orderId}|${params.paymentId}`).digest("hex");
  return safeEqualHex(expected, params.signature);
}

/** Checks the X-Razorpay-Signature header on a webhook against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret = process.env.RAZORPAY_WEBHOOK_SECRET): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
