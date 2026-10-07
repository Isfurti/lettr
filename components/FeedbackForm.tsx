"use client";

import { useState } from "react";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [consentToFeature, setConsentToFeature] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setStatus("sending");
    setError(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content, consentToFeature }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setError(body.error ?? "Couldn't submit your feedback.");
      return;
    }

    setReply(body.reply ?? null);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="bg-white border-2 border-rule rounded-[28px] p-6 sm:p-8">
        <p className="font-extrabold text-brand-blue mb-2">Thanks for the feedback</p>
        <p className="text-sm leading-relaxed">
          {reply ?? "We read every review. We'll email you a reply soon, and it will show here on this page too."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border-2 border-rule rounded-[28px] p-6 sm:p-8 space-y-5">
      <div>
        <p className="text-sm font-bold text-slate mb-2">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="w-11 h-11 flex items-center justify-center text-3xl leading-none"
            >
              <span className={(hoverRating || rating) >= star ? "text-gold-deep" : "text-rule"}>★</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-bold text-slate">What&apos;s working, what isn&apos;t?</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          minLength={10}
          required
          placeholder="e.g. The AI bullet rewriting saved me so much time, but I wish there were more template colors…"
          className="field-input mt-1.5"
        />
      </label>

      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={consentToFeature}
          onChange={(e) => setConsentToFeature(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm text-slate">
          It&apos;s okay to feature this review publicly on our website (we&apos;ll only show your
          first name, and only if our team selects it — not automatic).
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Submit feedback"}
      </button>
    </form>
  );
}
