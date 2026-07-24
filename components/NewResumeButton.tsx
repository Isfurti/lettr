"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function NewResumeButton({ label = "New resume" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  async function createResume() {
    setLoading(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Resume", template: "classic" }),
    });
    const body = await res.json();
    setLoading(false);

    if (res.status === 402) {
      setUpgradeRequired(true);
      return;
    }
    if (res.ok) router.push(`/builder/${body.id}`);
  }

  if (upgradeRequired) {
    return (
      <Link href="/pricing" className="text-sm text-seal hover:underline">
        Upgrade to create another resume →
      </Link>
    );
  }

  return (
    <button
      onClick={createResume}
      disabled={loading}
      className="bg-seal text-white px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
    >
      {loading ? "Creating…" : label}
    </button>
  );
}
