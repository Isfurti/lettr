"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("Couldn't reach the server.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={upgrade}
        disabled={loading}
        className="btn-press w-full min-h-12 rounded-full bg-gold text-ink font-extrabold shadow-[0_5px_0_var(--gold-deep)] disabled:opacity-60"
      >
        {loading ? "Redirecting…" : "Upgrade to Pro"}
      </button>
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
    </>
  );
}
