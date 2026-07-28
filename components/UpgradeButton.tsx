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
        className="w-full py-3.5 bg-seal rounded-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {loading ? "Redirecting…" : "Upgrade to Pro"}
      </button>
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
    </>
  );
}
