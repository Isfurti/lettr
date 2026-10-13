"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let result: Awaited<ReturnType<typeof signIn>> | undefined;
    try {
      result = await signIn("credentials", { email, password, redirect: false });
    } catch {
      setLoading(false);
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    if (result?.error) {
      setLoading(false);
      setError(
        result.code === "rate_limited"
          ? "Too many wrong passwords for this email. Wait 15 minutes and try again, or reset your password."
          : "Invalid email or password."
      );
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
      {status === "authenticated" && session?.user && !searchParams.get("continue") && (
        <p className="mb-5 bg-brand-blue-soft text-brand-blue-deep rounded-2xl px-4 py-3 text-sm">
          You&apos;re already signed in{session.user.email ? ` as ${session.user.email}` : ""}.{" "}
          <Link href="/dashboard" className="font-bold underline">
            Go to your dashboard
          </Link>
        </p>
      )}
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
            <Link href="/forgot-password" className="inline-flex items-center min-h-11 text-sm font-bold text-brand-blue hover:underline">
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
        <Link
          href={searchParams.get("continue") ? `/signup?continue=${encodeURIComponent(searchParams.get("continue")!)}` : "/signup"}
          className="font-bold text-brand-blue hover:underline"
        >
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
