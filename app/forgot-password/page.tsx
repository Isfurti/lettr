"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

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
    <>
      <PublicNav />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[400px] paper-sheet rounded-sm p-10">
          {status === "sent" ? (
            <div className="text-center">
              <h1 className="font-display font-semibold text-xl mb-2">Check your email</h1>
              <p className="text-sm text-ink-soft">
                If an account exists for {email}, a password reset link is on its way.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display font-semibold text-xl mb-2 text-center">Reset your password</h1>
              <p className="text-sm text-ink-soft mb-6 text-center">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={submit} className="space-y-6">
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
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-ink text-white py-3.5 rounded-sm font-medium hover:opacity-95 disabled:opacity-60 transition-opacity"
                >
                  {status === "sending" ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
          <p className="text-sm text-ink-soft mt-8 text-center">
            <Link href="/login" className="text-ink font-semibold hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
