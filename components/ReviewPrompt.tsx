"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  composeReview,
  isAppPage,
  readState,
  shouldAsk,
  snooze,
  writeState,
} from "@/lib/review-prompt";

/**
 * A small "How's Lettr working for you?" card for signed-in users. Bottom
 * right on a computer, a bottom sheet on a phone. It never blocks the page:
 * people can keep working while it's open.
 */
export function ReviewPrompt() {
  const pathname = usePathname() ?? "";
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [likes, setLikes] = useState("");
  const [improve, setImprove] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const checking = useRef(false);

  const onAppPage = status === "authenticated" && isAppPage(pathname);

  async function maybeOpen(downloaded: boolean) {
    if (checking.current) return;
    const state = readState();
    if (!shouldAsk(state, Date.now(), downloaded)) return;
    checking.current = true;
    // Someone who already wrote feedback (maybe on another device) isn't asked again.
    const res = await fetch("/api/reviews", { cache: "no-store" }).catch(() => null);
    const body = res?.ok ? await res.json().catch(() => ({})) : {};
    checking.current = false;
    if (body.reviewed) {
      writeState({ ...state, done: true });
      return;
    }
    if (res?.ok) setOpen(true);
  }

  // Count visits to the app pages; ask after a few.
  useEffect(() => {
    if (!onAppPage) return;
    const state = readState();
    if (state.done) return;
    writeState({ ...state, views: state.views + 1 });
    const t = window.setTimeout(() => maybeOpen(false), 4000);
    return () => window.clearTimeout(t);
  }, [onAppPage, pathname]);

  // A download is a good moment: ask a little after it finishes.
  useEffect(() => {
    if (status !== "authenticated") return;
    let t: number | undefined;
    const onDownload = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => maybeOpen(true), 6000);
    };
    window.addEventListener("lettr:download", onDownload);
    return () => {
      window.removeEventListener("lettr:download", onDownload);
      window.clearTimeout(t);
    };
  }, [status]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && later();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function later() {
    writeState(snooze(readState(), Date.now()));
    setOpen(false);
  }

  function never() {
    writeState({ ...readState(), done: true });
    setOpen(false);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Tap a star first.");
      return;
    }
    setSending(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content: composeReview(rating, likes, improve), consentToFeature: consent }),
    }).catch(() => null);
    setSending(false);
    if (!res) {
      setError("Couldn't reach Lettr. Check your connection and try again.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't send it. Please try again.");
      return;
    }
    writeState({ ...readState(), done: true });
    setThanks(true);
    window.setTimeout(() => setOpen(false), 3500);
  }

  if (!open || !onAppPage) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="review-prompt-title"
      className="fixed z-[60] inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] rise"
    >
      <div className="bg-white border-2 border-ink rounded-t-[28px] sm:rounded-[28px] shadow-[0_-8px_30px_rgba(4,22,50,0.18)] sm:shadow-[6px_6px_0_var(--ink)] p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto">
        {thanks ? (
          <div className="text-center py-2">
            <p className="font-brand font-extrabold text-2xl">Thank you!</p>
            <p className="mt-2 text-slate">We read every message. It helps us make Lettr better.</p>
          </div>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <p id="review-prompt-title" className="font-brand font-extrabold text-xl leading-tight">
                How&apos;s Lettr working for you?
              </p>
              <button
                type="button"
                onClick={later}
                aria-label="Close"
                className="shrink-0 w-10 h-10 -mt-1 -mr-1 rounded-full hover:bg-sand flex items-center justify-center text-xl text-slate"
              >
                ×
              </button>
            </div>

            <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => setRating(star)}
                  className="w-11 h-11 flex items-center justify-center text-[32px] leading-none"
                >
                  <span className={rating >= star ? "text-gold-deep" : "text-rule"}>★</span>
                </button>
              ))}
            </div>

            {rating > 0 && (
              <>
                <label className="block">
                  <span className="text-sm font-bold text-slate">What do you like?</span>
                  <textarea
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    rows={2}
                    maxLength={1200}
                    className="mt-1 w-full rounded-2xl border-2 border-rule px-4 py-3 text-base focus:border-brand-blue outline-none resize-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate">What should we improve?</span>
                  <textarea
                    value={improve}
                    onChange={(e) => setImprove(e.target.value)}
                    rows={2}
                    maxLength={1200}
                    className="mt-1 w-full rounded-2xl border-2 border-rule px-4 py-3 text-base focus:border-brand-blue outline-none resize-none"
                  />
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[var(--brand-blue)]"
                  />
                  <span>Lettr can show this review on the website, with my first name only.</span>
                </label>
              </>
            )}

            {error && <p className="text-sm font-bold text-red-700">{error}</p>}

            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={never} className="min-h-11 text-sm font-semibold text-slate hover:text-ink">
                Don&apos;t ask again
              </button>
              <button
                type="submit"
                disabled={sending || !rating}
                className="btn-press inline-flex items-center min-h-11 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
