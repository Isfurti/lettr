"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SNOOZE_DAYS, SNOOZE_KEY, composeReviewText } from "@/lib/review-prompt";

// Asks signed-in users who have made a resume what they like and what to
// improve. Only on the dashboard pages (never mid-edit in the builder), a
// short while after the page opens. "Not now" waits SNOOZE_DAYS on this device.
const SHOW_ON = ["/dashboard", "/dashboard/applications", "/dashboard/interview"];
const DELAY_MS = 20_000;

function snoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
}
function snooze(days: number) {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 86_400_000));
  } catch {
    // storage blocked: the pop-up may ask again next visit, which is fine
  }
}

export function ReviewPrompt() {
  const pathname = usePathname();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [likes, setLikes] = useState("");
  const [improve, setImprove] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const firstStar = useRef<HTMLButtonElement>(null);

  const eligiblePage = SHOW_ON.includes(pathname ?? "");

  useEffect(() => {
    if (status !== "authenticated" || !eligiblePage || open || snoozed()) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled || snoozed()) return;
      const res = await fetch("/api/reviews/prompt", { cache: "no-store" }).catch(() => null);
      const body = res?.ok ? await res.json().catch(() => null) : null;
      if (!cancelled && body?.show) setOpen(true);
    }, DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [status, eligiblePage, open]);

  useEffect(() => {
    if (!open) return;
    firstStar.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") notNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function notNow() {
    snooze(SNOOZE_DAYS);
    setOpen(false);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return setError("Tap a star to rate Lettr.");
    const content = composeReviewText(likes, improve);
    if (content.length < 10 || (likes.trim().length < 3 && improve.trim().length < 3)) {
      return setError("Tell us a little about what you like or what to improve.");
    }
    setError(null);
    setState("sending");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content, consentToFeature: consent }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const body = res ? await res.json().catch(() => ({})) : {};
      setState("idle");
      return setError(body.error ?? "Couldn't send it. Check your connection and try again.");
    }
    setState("done");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/40 p-4" onClick={notNow}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-prompt-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
      >
        {state === "done" ? (
          <div className="flex flex-col gap-3">
            <p id="review-prompt-title" className="font-brand font-extrabold text-2xl tracking-tight">
              Thank you!
            </p>
            <p className="text-slate">We read every answer, and it shapes what we build next.</p>
            <button
              onClick={() => setOpen(false)}
              className="btn-press self-start inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <p id="review-prompt-title" className="font-brand font-extrabold text-2xl leading-tight tracking-tight">
                How&apos;s Lettr working for you?
              </p>
              <button type="button" onClick={notNow} aria-label="Not now" className="shrink-0 w-10 h-10 -mr-2 -mt-1 rounded-full hover:bg-sand text-xl">
                ×
              </button>
            </div>

            <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  ref={n === 1 ? firstStar : undefined}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="w-11 h-11 flex items-center justify-center text-[32px] leading-none"
                >
                  <span className={(hover || rating) >= n ? "text-gold-deep" : "text-rule"}>★</span>
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate">What do you like?</span>
              <textarea value={likes} onChange={(e) => setLikes(e.target.value)} rows={2} maxLength={1400} className="field-input mt-1.5" placeholder="e.g. The ATS score made it clear what to fix" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate">What should we improve?</span>
              <textarea value={improve} onChange={(e) => setImprove(e.target.value)} rows={2} maxLength={1400} className="field-input mt-1.5" placeholder="e.g. More template colours" />
            </label>

            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span className="text-sm text-slate">Lettr can show this review on the website (first name only).</span>
            </label>

            {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={state === "sending"}
                className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Send"}
              </button>
              <button type="button" onClick={notNow} className="min-h-11 px-2 font-bold text-slate underline">
                Not now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
