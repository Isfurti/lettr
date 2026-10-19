"use client";

import { useState } from "react";

/** Sends a harmless test error to Sentry so you can check alerts arrive. */
export function SentryTestButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    setState("sending");
    try {
      const res = await fetch("/api/admin/sentry-test", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error ?? "Sentry didn't accept the test error.");
      setState("sent");
      setMessage("Sent. It should appear in Sentry → Issues within a minute.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Couldn't send the test error.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={send}
        disabled={state === "sending"}
        className="text-sm border border-rule rounded-xl px-3 py-1.5 hover:bg-sand disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send test error"}
      </button>
      {message && <p className={`text-xs ${state === "error" ? "text-red-700" : "text-green-800"}`}>{message}</p>}
    </div>
  );
}
