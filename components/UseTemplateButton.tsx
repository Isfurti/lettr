"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UseTemplateButton({ template, label = "Use this template" }: { template: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function use() {
    setLoading(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Resume", template }),
    });
    setLoading(false);

    if (res.status === 401) {
      router.push(`/signup?next=/templates&template=${template}`);
      return;
    }
    if (res.status === 402) {
      router.push("/pricing");
      return;
    }
    if (res.ok) {
      const body = await res.json();
      router.push(`/builder/${body.id}`);
    }
  }

  return (
    <button
      onClick={use}
      disabled={loading}
      className="w-full bg-ink text-white text-sm font-medium py-2 rounded-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
    >
      {loading ? "Creating…" : label}
    </button>
  );
}
