"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlanId } from "@/lib/plans";

/** What the Pro button can do for this visitor, worked out on the server. */
export type CheckoutState =
  /** Payments aren't switched on yet. */
  | "closed"
  /** Prices are in a currency we can't take yet (outside India). */
  | "unavailable"
  | "signed-out"
  /** Has Pro from the Lettr team, nothing to buy. */
  | "comped"
  | "ready";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;
function loadRazorpay(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  scriptPromise ??= new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

const BUTTON =
  "btn-press flex items-center justify-center w-full min-h-12 rounded-full font-extrabold bg-gold text-ink shadow-[0_5px_0_var(--gold-deep)] disabled:opacity-60";
const MUTED = "flex items-center justify-center w-full min-h-12 rounded-full font-extrabold cursor-not-allowed bg-gold/90 text-ink";

export function ProCheckoutButton({ plan, state, label }: { plan: PlanId; state: CheckoutState; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === "closed") return <button type="button" disabled className={MUTED}>Opens at launch</button>;
  if (state === "unavailable") return <button type="button" disabled className={MUTED}>Coming soon in your country</button>;
  if (state === "comped") return <button type="button" disabled className={MUTED}>You have Pro</button>;
  if (state === "signed-out") {
    return (
      <Link href="/signup?continue=pricing" className={BUTTON}>
        {label}
      </Link>
    );
  }

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const [loaded, res] = await Promise.all([
        loadRazorpay(),
        fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        }),
      ]);
      const order = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(order.error ?? "Couldn't start checkout.");
      if (!loaded || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Lettr",
        description: order.description,
        image: `${window.location.origin}/icons/icon-512.png`,
        prefill: { name: order.name, email: order.email },
        theme: { color: "#041632" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          try {
            const done = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(r),
            });
            const body = await done.json().catch(() => ({}));
            if (!done.ok) throw new Error(body.error ?? "We couldn't confirm the payment.");
            window.location.href = "/dashboard?upgraded=1";
          } catch (err) {
            setError(err instanceof Error ? err.message : "We couldn't confirm the payment.");
            setBusy(false);
          }
        },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description ?? "The payment didn't go through. You haven't been charged.");
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach the server.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={buy} disabled={busy} className={BUTTON}>
        {busy ? "Opening payment…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-red-200">
          {error}
        </p>
      )}
    </>
  );
}
