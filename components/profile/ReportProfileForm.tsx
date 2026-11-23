"use client";

import { useState } from "react";

const REASONS = [
  { id: "not_me", label: "This is about me and I did not make it" },
  { id: "private_info", label: "It shows private information" },
  { id: "harassment", label: "Harassment or abuse" },
  { id: "spam", label: "Spam or a scam" },
  { id: "other", label: "Something else" },
] as const;

export function ReportProfileForm({ slug }: { slug: string }) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/profile/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, reason, details: details.trim() || undefined, email: email.trim() || undefined }),
      });
      if (res.ok) return setState("done");
      const data = await res.json().catch(() => ({}));
      setError(String(data.error ?? "Couldn't send the report. Try again."));
    } catch {
      setError("Couldn't reach Lettr. Check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-[20px] border-2 border-[#e8e2d2] bg-white p-5">
        <p className="text-lg font-extrabold">Thank you. We got your report.</p>
        <p className="mt-1 text-[#27344f]">We will look at it. If you gave an email address, we may write to you.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">What is wrong?</legend>
        {REASONS.map((r) => (
          <label key={r.id} className="flex min-h-11 items-center gap-3 rounded-[14px] border-2 border-[#e8e2d2] bg-white px-4">
            <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="size-5 accent-[#2f5bea]" />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Details (optional)</span>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={4} className="rounded-[14px] border-2 border-[#e8e2d2] bg-white p-3" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Your email (optional, only if you want a reply)</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" className="min-h-12 rounded-[14px] border-2 border-[#e8e2d2] bg-white px-3" />
      </label>
      {error && <p role="alert" className="font-bold text-[#b3261e]">{error}</p>}
      <button type="submit" aria-disabled={!reason || state === "sending"} onClick={(e) => { if (!reason || state === "sending") e.preventDefault(); }} className="inline-flex min-h-12 items-center justify-center self-start rounded-full bg-[#ffc94d] px-6 font-extrabold text-[#041632] shadow-[0_4px_0_#e0a800] aria-disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bea]">
        {state === "sending" ? "Sending..." : "Send report"}
      </button>
    </form>
  );
}
