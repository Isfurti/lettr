"use client";

import { useState } from "react";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (res.ok) window.location.href = body.url;
  }

  return (
    <button onClick={openPortal} disabled={loading} className="text-ink-soft hover:text-ink">
      {loading ? "Opening…" : "Manage subscription"}
    </button>
  );
}
