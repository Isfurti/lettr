"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/** Friendly error screen for anything that fails inside a page (the root layout and nav still render). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center bg-cream text-ink px-4 py-20 sm:py-28">
      <div className="text-center max-w-lg">
        <div className="mx-auto mb-8 w-[110px] h-[110px] rounded-full bg-gold text-ink flex items-center justify-center rotate-[8deg] shadow-[0_6px_0_var(--gold-deep)] font-brand font-extrabold text-5xl">
          !
        </div>
        <h1 className="font-brand font-extrabold text-[34px] sm:text-[44px] leading-[1.05] tracking-tight">Something went wrong.</h1>
        <p className="mt-4 text-lg text-slate">We&apos;ve been told about it. Your saved work is safe. Try again in a moment.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]"
          >
            Try again
          </button>
          <Link href="/" className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-white border-2 border-ink font-bold">
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
