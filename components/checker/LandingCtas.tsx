"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { trackLandingCta } from "@/lib/analytics";

/** The two buttons under the checker's headline: check a file now, or start a resume from scratch. */
export function HeroCtas() {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <a
        href="#checker"
        onClick={() => trackLandingCta("hero_check")}
        className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]"
      >
        Check my resume free
      </a>
      <Link
        href="/signup"
        onClick={() => trackLandingCta("hero_build")}
        className="inline-flex items-center min-h-12 px-5 rounded-full border-2 border-ink font-bold hover:bg-ink hover:text-white transition-colors"
      >
        No file? Build one with AI
      </Link>
    </div>
  );
}

/** For visitors with no resume file on hand (common on a phone): a way in that doesn't need one. */
export function NoFileStrip() {
  const { status } = useSession();
  if (status === "authenticated") return null;
  return (
    <div className="mt-6 bg-brand-blue-soft rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
      <div className="max-w-xl">
        <p className="font-brand font-extrabold text-xl leading-tight">Don&apos;t have a resume file handy?</p>
        <p className="mt-1 text-[15px] text-slate leading-snug">
          Create a free account and let AI help you write one from scratch. It scores itself as you type. No card needed.
        </p>
      </div>
      <Link
        href="/signup"
        onClick={() => trackLandingCta("nofile_build")}
        className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]"
      >
        Sign up free
      </Link>
    </div>
  );
}

/** A slim bar pinned to the bottom of phone screens for signed-out visitors. */
export function StickySignup() {
  const { status } = useSession();
  if (status !== "unauthenticated") return null;
  return (
    <>
    <div aria-hidden="true" className="sm:hidden h-20" />
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-rule px-4 py-3 flex items-center justify-between gap-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <p className="text-sm font-bold leading-tight">Free account: build and fix your resume with AI</p>
      <Link
        href="/signup"
        onClick={() => trackLandingCta("sticky_signup")}
        className="shrink-0 inline-flex items-center min-h-11 px-5 rounded-full bg-brand-blue text-white text-sm font-bold"
      >
        Sign up
      </Link>
    </div>
    </>
  );
}
