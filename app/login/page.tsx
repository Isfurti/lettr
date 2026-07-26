"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PublicNav } from "@/components/PublicNav";
import { OAuthButtons } from "@/components/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const decor = decorRef.current;
      if (!decor) return;
      const x = (e.clientX - window.innerWidth / 2) * 0.05;
      const y = (e.clientY - window.innerHeight / 2) * 0.05;
      decor.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <>
    <PublicNav />
    <main className="flex-1 flex items-center justify-center px-6 py-20 relative overflow-hidden">
      <div
        ref={decorRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ink/5 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="hidden xl:block absolute right-[-50px] top-[15%] w-[340px] h-[480px] bg-white paper-sheet rounded-sm opacity-20 rotate-12 pointer-events-none border border-rule/40 overflow-hidden">
        <div className="p-10 space-y-4">
          <div className="h-6 bg-ink/10 w-3/4" />
          <div className="h-3 bg-ink/5 w-full" />
          <div className="h-3 bg-ink/5 w-5/6" />
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="h-24 bg-ink/5" />
            <div className="h-24 bg-ink/5" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-[440px] paper-sheet rounded-sm p-10 relative z-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-seal font-semibold mb-3">Welcome back</p>
          <h1 className="font-display font-semibold text-2xl mb-1">Access your career hub</h1>
          <p className="text-ink-soft text-sm">Refine your professional narrative with AI-powered precision.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-ink-soft">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="editorial-input w-full mt-1 text-sm"
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-ink-soft">Password</span>
              <Link href="/forgot-password" className="text-xs text-seal hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="editorial-input w-full mt-1 text-sm"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white py-3.5 rounded-sm font-medium hover:opacity-95 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <OAuthButtons />

        <p className="text-sm text-ink-soft mt-8 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-ink font-semibold hover:underline">
            Start building
          </Link>
        </p>
      </div>
    </main>
    <Footer />
    </>
  );
}
