"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CardPage } from "@/components/AuthShell";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2">Invalid link</h1>
        <p className="text-slate mb-6">This password reset link is missing its token.</p>
        <Link href="/forgot-password" className="font-bold text-brand-blue hover:underline">
          Request a new one →
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="mx-auto mb-4 w-14 h-14 rounded-full bg-gold text-ink text-2xl font-extrabold flex items-center justify-center shadow-[0_4px_0_var(--gold-deep)]">
          ✓
        </p>
        <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2">Password updated</h1>
        <p className="text-slate">Redirecting you to log in…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2 text-center">Set a new password</h1>
      <form onSubmit={submit} className="space-y-6 mt-6">
        <label className="block">
          <span className="text-sm font-bold text-slate">New password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input mt-1.5"
          />
          <span className="block mt-1 text-sm text-slate">At least 8 characters</span>
        </label>
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-press inline-flex items-center justify-center w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <CardPage>
      <Suspense fallback={<p className="text-center text-slate">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </CardPage>
  );
}
