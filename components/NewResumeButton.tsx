"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function NewResumeButton({ label = "New resume" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createResume() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Resume", template: "classic" }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 402) {
        setUpgradeRequired(true);
        return;
      }
      if (res.ok && body.id) {
        router.push(`/builder/${body.id}`);
        return; // keep the button busy while the builder opens
      }
      setError(body.error ?? "Couldn't create a resume. Please try again.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setLoading(false);
  }

  if (upgradeRequired) {
    return (
      <Link href="/pricing" className="inline-flex items-center min-h-11 text-sm font-bold text-brand-blue hover:underline">
        Upgrade to create another resume →
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        onClick={createResume}
        disabled={loading}
        className="btn-press inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-brand-blue text-white text-[15px] font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-60"
      >
        {loading ? "Creating…" : label}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600 mt-1.5 max-w-xs">
          {error}
        </span>
      )}
    </span>
  );
}
