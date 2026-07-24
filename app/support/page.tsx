"use client";

import { useState } from "react";

export default function SupportPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subject, message }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) {
      setSubject("");
      setMessage("");
    }
  }

  if (status === "sent") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="paper-sheet rounded-sm p-8 max-w-sm text-center">
          <p className="font-display font-bold text-lg mb-2">Message sent</p>
          <p className="text-sm text-ink-soft">We&apos;ll get back to you at {email}.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="font-display font-bold text-2xl mb-1">Contact support</h1>
          <p className="text-ink-soft text-sm">We read every message.</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Your email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Subject</span>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1.5 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Message</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
          />
        </label>

        {status === "error" && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-seal text-white py-2.5 rounded-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>
    </main>
  );
}
