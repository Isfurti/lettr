"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function PublicNav() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && Boolean(session?.user);
  const initial = (session?.user?.name || session?.user?.email || "?")[0]?.toUpperCase();

  return (
    <header className="border-b border-rule bg-paper">
      <div className="max-w-6xl mx-auto w-full px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-xl hover:opacity-80 transition-opacity">
          Lettr
        </Link>
        <nav className="hidden sm:flex items-center gap-8 text-sm text-ink-soft">
          <Link href="/#features" className="hover:text-ink">Features</Link>
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
        </nav>
        <div className="flex items-center gap-5">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink">Dashboard</Link>
              <Link
                href="/dashboard"
                className="w-9 h-9 rounded-full bg-ink text-white text-sm font-medium flex items-center justify-center hover:opacity-90"
              >
                {initial}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-ink-soft hover:text-ink">Sign in</Link>
              <Link
                href="/signup"
                className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Build Resume
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
