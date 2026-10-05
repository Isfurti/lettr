"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButtons } from "@/components/OAuthButtons";
import { completeGuestExport } from "@/lib/guest-draft";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    if (searchParams.get("continue") === "export" || searchParams.get("continue") === "builder") {
      const handled = await completeGuestExport((path) => router.push(path));
      setLoading(false);
      if (handled) return;
    }

    setLoading(false);
    router.push(searchParams.get("continue") === "import" ? "/dashboard?import=1" : "/dashboard");
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="text-sm font-bold text-slate">Email address</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input mt-1.5"
          />
        </label>
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate">Password</span>
            <Link href="/forgot-password" className="text-sm font-bold text-brand-blue hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input mt-1.5"
          />
        </label>

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <OAuthButtons callbackUrl={searchParams.get("continue") === "import" ? "/dashboard?import=1" : "/dashboard"} />

      <p className="text-slate mt-8 text-center">
        New to Lettr?{" "}
        <Link href="/signup" className="font-bold text-brand-blue hover:underline">
          Create a free account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to Lettr" subtitle="Pick up where you left off.">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
