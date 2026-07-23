"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-bold text-2xl mb-1">Log in</h1>
        <p className="text-ink-soft text-sm mb-8">Welcome back.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-2.5 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
