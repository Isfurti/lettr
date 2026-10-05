"use client";

import { useState } from "react";
import Link from "next/link";
import { CardPage } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Always show the same success state, regardless of whether the email
    // exists - the API deliberately doesn't reveal that either.
    setStatus("sent");
  }

  return (
    <CardPage>
      {status === "sent" ? (
        <div className="text-center">
          <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2">Check your email</h1>
          <p className="text-slate">If an account exists for {email}, a password reset link is on its way.</p>
        </div>
      ) : (
        <>
          <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2 text-center">Reset your password</h1>
          <p className="text-slate mb-6 text-center">Enter your email and we&apos;ll send you a reset link.</p>
          <form onSubmit={submit} className="space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-slate">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input mt-1.5"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-press inline-flex items-center justify-center w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <p className="text-slate mt-8 text-center">
        <Link href="/login" className="font-bold text-brand-blue hover:underline">
          Back to login
        </Link>
      </p>
    </CardPage>
  );
}
