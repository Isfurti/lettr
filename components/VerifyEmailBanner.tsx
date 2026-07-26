"use client";

import { useState } from "react";

export function VerifyEmailBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    const body = await res.json();
    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(body.error ?? "Couldn't send email.");
    }
  }

  return (
    <div className="mb-6 bg-seal-soft text-seal-deep text-sm rounded-sm px-4 py-3 flex items-center justify-between gap-4">
      <span>
        {status === "sent" ? "Verification email sent — check your inbox." : "Please verify your email address."}
      </span>
      {status !== "sent" && (
        <button
          onClick={resend}
          disabled={status === "sending"}
          className="shrink-0 underline font-medium hover:opacity-80 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Resend email"}
        </button>
      )}
      {error && <span className="text-red-700 text-xs shrink-0">{error}</span>}
    </div>
  );
}
