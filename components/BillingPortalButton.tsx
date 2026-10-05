"use client";

import { useState } from "react";

export function BillingPortalButton({
  label = "Manage subscription →",
  className = "inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline",
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setError(body.error ?? "Couldn't open billing right now.");
    } catch {
      setError("Couldn't reach the server.");
    }
    setLoading(false);
  }

  return (
    <span className="inline-flex flex-col">
      <button onClick={openPortal} disabled={loading} className={`text-left disabled:opacity-60 ${className}`}>
        {loading ? "Opening…" : label}
      </button>
      {error && <span className="text-xs text-red-600 mt-0.5 max-w-xs">{error}</span>}
    </span>
  );
}
