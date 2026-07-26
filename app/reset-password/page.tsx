"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

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
        <h1 className="font-display font-semibold text-xl mb-2">Invalid link</h1>
        <p className="text-sm text-ink-soft mb-6">This password reset link is missing its token.</p>
        <Link href="/forgot-password" className="text-seal font-medium hover:underline">
          Request a new one →
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-3xl mb-3">✓</p>
        <h1 className="font-display font-semibold text-xl mb-2">Password updated</h1>
        <p className="text-sm text-ink-soft">Redirecting you to log in…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display font-semibold text-xl mb-2 text-center">Set a new password</h1>
      <form onSubmit={submit} className="space-y-6 mt-6">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-ink-soft">New password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="editorial-input w-full mt-1 text-sm"
          />
          <span className="text-xs text-ink-soft">At least 8 characters</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3.5 rounded-sm font-medium hover:opacity-95 disabled:opacity-60 transition-opacity"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <PublicNav />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[400px] paper-sheet rounded-sm p-10">
          <Suspense fallback={<p className="text-center text-sm text-ink-soft">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
