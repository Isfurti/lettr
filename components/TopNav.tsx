"use client";

import Link from "next/link";
import { NewResumeButton } from "@/components/NewResumeButton";

export function TopNav({
  active,
  userInitial,
}: {
  active?: "templates";
  userInitial?: string;
}) {
  return (
    <header className="border-b border-rule bg-paper-raised px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <Link href="/" className="font-display font-semibold text-xl text-ink">
          Lettr
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm">
          <Link
            href="/templates"
            className={active === "templates" ? "text-ink font-medium border-b-2 border-seal pb-1" : "text-ink-soft hover:text-ink"}
          >
            Templates
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <NewResumeButton label="✦ Build Resume" />
        {userInitial && (
          <Link
            href="/dashboard"
            title="Go to dashboard"
            className="w-8 h-8 rounded-full bg-ink text-white text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {userInitial}
          </Link>
        )}
      </div>
    </header>
  );
}
