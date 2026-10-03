"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({
  userId,
  currentPlan,
  emailVerified,
  hasPaidSubscription = false,
  isSelf = false,
}: {
  userId: string;
  currentPlan: string;
  emailVerified: boolean;
  /** Has a live Stripe subscription - plan is controlled by Stripe, not here. */
  hasPaidSubscription?: boolean;
  /** This is the admin's own account. */
  isSelf?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [justVerified, setJustVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, body?: unknown): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That didn't work. Please try again.");
        return false;
      }
      return true;
    } catch {
      setError("Couldn't reach the server.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function togglePlan() {
    const toPro = currentPlan !== "pro";
    const message = toPro
      ? "Give this user Pro for free? They won't be charged, and it shows as \"Pro · comp\"."
      : "Remove this user's Pro access? They'll go back to the Free plan limits straight away.";
    if (!confirm(message)) return;
    if (await call(`/api/admin/users/${userId}/plan`, { plan: toPro ? "pro" : "free" })) router.refresh();
  }

  async function verifyEmail() {
    if (await call(`/api/admin/users/${userId}/verify-email`)) {
      setJustVerified(true);
      router.refresh();
    }
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete this user's account and all their resumes? This cannot be undone.")) return;
    if (await call(`/api/admin/users/${userId}/delete`)) router.push("/admin/users");
  }

  const btn = "text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-app-bg disabled:opacity-50";

  return (
    <div className="flex flex-col items-start sm:items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!emailVerified && !justVerified && (
          <button
            onClick={verifyEmail}
            disabled={loading}
            title="Manually mark this account's email as verified - useful if they're stuck unable to verify"
            className={btn}
          >
            Mark email verified
          </button>
        )}
        {hasPaidSubscription ? (
          <span className="text-xs text-ink-soft" title="Cancel or refund in Stripe - the plan updates automatically">
            Paid via Stripe — manage there
          </span>
        ) : (
          <button onClick={togglePlan} disabled={loading} className={btn}>
            {currentPlan === "pro" ? "Remove comped Pro" : "Give Pro (comp)"}
          </button>
        )}
        <button
          onClick={deleteAccount}
          disabled={loading || isSelf || hasPaidSubscription}
          title={
            isSelf
              ? "You can't delete your own admin account here"
              : hasPaidSubscription
              ? "Cancel their Stripe subscription first, so they aren't charged after deletion"
              : undefined
          }
          className="text-sm text-red-600 border border-red-200 rounded-sm px-3 py-1.5 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Delete account
        </button>
      </div>
      {error && <p className="text-xs text-red-600 max-w-xs">{error}</p>}
    </div>
  );
}
