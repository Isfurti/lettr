"use client";

import { useState } from "react";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
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
      body: JSON.stringify({ rating, content }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setError(body.error ?? "Couldn't submit your feedback.");
      return;
    }

    setReply(body.reply);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="paper-sheet rounded-sm p-6">
        <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Thanks for the feedback</p>
        <p className="text-sm leading-relaxed">{reply}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="paper-sheet rounded-sm p-6 space-y-5">
      <div>
        <p className="text-sm font-medium mb-2">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl leading-none"
            >
              <span className={(hoverRating || rating) >= star ? "text-seal" : "text-rule"}>★</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium">What's working, what isn't?</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          minLength={10}
          required
          placeholder="e.g. The AI bullet rewriting saved me so much time, but I wish there were more template colors…"
          className="mt-1.5 w-full border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-seal text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Submit feedback"}
      </button>
    </form>
  );
}
