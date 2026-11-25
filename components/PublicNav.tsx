"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { InstallAppButton } from "@/components/AppInstall";
import { NavMenu } from "@/components/NavMenu";
import { SERVICES, TEMPLATE_LINKS, type ServiceItem } from "@/lib/services";

// Shown only in the mobile menu; the desktop header leaves them out.
const MOBILE_ONLY = [
  { href: "/#how", label: "How it works" },
];

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Help" },
];

type Item = ServiceItem;
const MENUS: { id: string; label: string; items: Item[]; cols: boolean }[] = [
  { id: "services", label: "Services", items: SERVICES, cols: true },
  { id: "browse", label: "Templates", items: TEMPLATE_LINKS, cols: true },
];

export function PublicNav() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && Boolean(session?.user);
  const initial = (session?.user?.name || session?.user?.email || "?")[0]?.toUpperCase();
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <header className="relative z-40 bg-cream">
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-4 sm:py-5 flex items-center justify-between gap-3">
        <Logo compact={pathname !== "/"} />
        <nav aria-label="Main" className="hidden lg:flex items-center gap-5 xl:gap-7 text-[15px] font-semibold">
          {MENUS.map((m) => <NavMenu key={m.id} {...m} />)}
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap hover:text-brand-blue transition-colors ${pathname === l.href ? "text-brand-blue" : "text-ink"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hidden sm:inline text-[15px] font-semibold hover:text-brand-blue">
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                aria-label="Go to dashboard"
                className="w-10 h-10 rounded-full bg-ink text-white text-sm font-bold flex items-center justify-center hover:opacity-90"
              >
                {initial}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline text-[15px] font-semibold hover:text-brand-blue">
                Sign in
              </Link>
              <Link
                href="/builder/new"
                className="btn-press inline-flex items-center min-h-11 px-5 rounded-full bg-brand-blue text-white text-[15px] font-bold shadow-[0_4px_0_var(--brand-blue-deep)] whitespace-nowrap"
              >
                Start free
              </Link>
            </>
          )}
          <button
            onClick={() => { setOpen((o) => !o); setSubOpen(null); }}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden w-11 h-11 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-sand"
          >
            <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Mobile"
          className="lg:hidden absolute inset-x-0 top-full bg-cream border-b border-rule shadow-lg px-4 py-2 flex flex-col text-base font-semibold"
        >
          {MENUS.map((m) => (
            <div key={m.id} className="flex flex-col">
              <button
                type="button"
                aria-expanded={subOpen === m.id}
                aria-controls={`${m.id}-mobile`}
                onClick={() => setSubOpen((c) => (c === m.id ? null : m.id))}
                className="py-3 border-b border-rule/60 flex items-center justify-between text-left"
              >
                {m.label}
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${subOpen === m.id ? "rotate-180" : ""}`}>
                  <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {subOpen === m.id && (
                <div id={`${m.id}-mobile`} className="flex flex-col">
                  {m.items.map((s) => (
                    <Link key={s.label} href={s.href} className="py-2.5 pl-4 border-b border-rule/60 font-medium text-ink/80" onClick={() => { setOpen(false); setSubOpen(null); }}>
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {[...MOBILE_ONLY, ...LINKS].map((l) => (
            <Link key={l.href} href={l.href} className="py-3 border-b border-rule/60" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <Link href="/dashboard" className="py-3 border-b border-rule/60" onClick={() => setOpen(false)}>Dashboard</Link>
          ) : (
            <Link href="/login" className="py-3 border-b border-rule/60" onClick={() => setOpen(false)}>Sign in</Link>
          )}
          <InstallAppButton
            label="Install the Lettr app"
            onDone={() => setOpen(false)}
            className="py-3 text-left font-bold text-brand-blue"
          />
        </nav>
      )}
    </header>
  );
}
