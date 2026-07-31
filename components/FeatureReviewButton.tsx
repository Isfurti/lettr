"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeatureReviewButton({
  reviewId,
  consentGiven,
  isFeatured,
}: {
  reviewId: string;
  consentGiven: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/reviews/${reviewId}/feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !isFeatured }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't update.");
      return;
    }
    router.refresh();
  }

  if (!consentGiven) {
    return <span className="text-xs text-ink-soft italic">No consent to feature</span>;
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-sm font-medium disabled:opacity-60 ${
          isFeatured ? "bg-admin-accent text-white" : "border border-admin-accent text-admin-accent hover:bg-admin-accent-soft"
        }`}
      >
        {loading ? "…" : isFeatured ? "★ Featured — remove" : "Feature on landing page"}
      </button>
      {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
