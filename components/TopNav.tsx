"use client";

import Link from "next/link";
import { Bell, Settings, Home } from "lucide-react";

export function TopNav({
  active,
  userInitial,
}: {
  active?: "dashboard" | "resumes" | "templates";
  userInitial?: string;
}) {
  return (
    <header className="border-b border-rule bg-paper-raised px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <Link href="/dashboard" className="font-display font-semibold text-xl text-ink">
          Lettr
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm">
          <Link
            href="/dashboard"
            className={active === "dashboard" ? "text-ink font-medium border-b-2 border-seal pb-1" : "text-ink-soft hover:text-ink"}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className={active === "resumes" ? "text-ink font-medium border-b-2 border-seal pb-1" : "text-ink-soft hover:text-ink"}
          >
            Resumes
          </Link>
          <Link
            href="/templates"
            className={active === "templates" ? "text-ink font-medium border-b-2 border-seal pb-1" : "text-ink-soft hover:text-ink"}
          >
            Templates
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-ink-soft hover:text-ink" title="Visit homepage">
          <Home className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </Link>
        <Link href="/support" className="text-ink-soft hover:text-ink" title="Support">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </Link>
        <Link href="/pricing" className="text-ink-soft hover:text-ink" title="Billing">
          <Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </Link>
        <Link
          href="/dashboard"
          className="bg-seal text-white text-sm font-medium px-4 py-2 rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          ✦ Build Resume
        </Link>
        {userInitial && (
          <div className="w-8 h-8 rounded-full bg-ink text-white text-xs font-medium flex items-center justify-center">
            {userInitial}
          </div>
        )}
      </div>
    </header>
  );
}
