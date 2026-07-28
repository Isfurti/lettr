"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({ userId, currentPlan }: { userId: string; currentPlan: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function togglePlan() {
    setLoading(true);
    const newPlan = currentPlan === "pro" ? "free" : "pro";
    await fetch(`/api/admin/users/${userId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete this user's account and all their resumes? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/delete`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.push("/admin/users");
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={togglePlan}
        disabled={loading}
        className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-app-bg disabled:opacity-60"
      >
        {loading ? "…" : currentPlan === "pro" ? "Downgrade to Free" : "Upgrade to Pro"}
      </button>
      <button
        onClick={deleteAccount}
        disabled={loading}
        className="text-sm text-red-600 border border-red-200 rounded-sm px-3 py-1.5 hover:bg-red-50 disabled:opacity-60"
      >
        Delete account
      </button>
    </div>
  );
}
