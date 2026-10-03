"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicNav() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && Boolean(session?.user);
  const initial = (session?.user?.name || session?.user?.email || "?")[0]?.toUpperCase();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-rule bg-paper relative z-40">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
        <Link href="/" className="font-display font-semibold text-xl hover:opacity-80 transition-opacity">
          Lettr
        </Link>
        <nav className="hidden sm:flex items-center gap-8 text-sm text-ink-soft">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`hover:text-ink ${pathname === l.href ? "text-ink font-medium" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hidden sm:inline text-sm text-ink-soft hover:text-ink">Dashboard</Link>
              <Link
                href="/dashboard"
                aria-label="Go to dashboard"
                className="w-9 h-9 rounded-full bg-ink text-white text-sm font-medium flex items-center justify-center hover:opacity-90"
              >
                {initial}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline text-sm text-ink-soft hover:text-ink">Sign in</Link>
              <Link
                href="/builder/new"
                className="bg-ink text-white px-3 sm:px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Build Resume
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-sm hover:bg-app-bg"
          >
            <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="sm:hidden absolute inset-x-0 top-full bg-paper border-b border-rule shadow-lg px-4 py-3 flex flex-col text-base">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="py-3 border-b border-rule/60" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <Link href="/dashboard" className="py-3" onClick={() => setOpen(false)}>Dashboard</Link>
          ) : (
            <Link href="/login" className="py-3" onClick={() => setOpen(false)}>Sign in</Link>
          )}
        </nav>
      )}
    </header>
  );
}
