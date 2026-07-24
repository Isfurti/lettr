"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve() {
    setLoading(true);
    await fetch("/api/support/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "resolved" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      className="text-xs text-seal hover:underline disabled:opacity-60"
    >
      {loading ? "Marking resolved…" : "Mark resolved"}
    </button>
  );
}
