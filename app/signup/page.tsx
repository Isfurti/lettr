"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButtons } from "@/components/OAuthButtons";
import { completeGuestExport } from "@/lib/guest-draft";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", { email, password, redirect: false });

    if (signInResult?.error) {
      setLoading(false);
      setError("Account created — please log in.");
      router.push("/login");
      return;
    }

    // If they were mid-export as a guest, finish that instead of just
    // dropping them on the dashboard - this is the whole point of letting
    // people build before signing up.
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
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          hint="At least 8 characters"
        />

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <OAuthButtons callbackUrl={searchParams.get("continue") === "import" ? "/dashboard?import=1" : "/dashboard"} />

      <p className="text-slate mt-8 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-blue hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <AuthShell eyebrow="Free to start" title="Create your account" subtitle="No credit card. Takes a few seconds.">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input mt-1.5"
      />
      {hint && <span className="block mt-1 text-sm text-slate">{hint}</span>}
    </label>
  );
}
