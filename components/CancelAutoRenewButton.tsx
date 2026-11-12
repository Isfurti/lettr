"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Stops auto-renew after a confirm step. Pro keeps running to the end of the paid month. */
export function CancelAutoRenewButton({ proUntil }: { proUntil: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscription/cancel", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "We couldn't cancel right now.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't cancel right now.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center min-h-11 font-bold text-slate hover:text-ink hover:underline"
      >
        Cancel auto-renew
      </button>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm">You won&apos;t be charged again, and Pro stays on until {proUntil}.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="inline-flex items-center min-h-11 px-4 rounded-full border-2 border-ink font-bold disabled:opacity-60"
        >
          {busy ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="inline-flex items-center min-h-11 px-4 rounded-full font-bold text-brand-blue"
        >
          Keep it
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
