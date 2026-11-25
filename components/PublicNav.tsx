"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { InstallAppButton } from "@/components/AppInstall";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/resume-checker", label: "Free checker" },
  { href: "/templates", label: "Templates" },
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Help" },
];

const SERVICES = [
  { href: "/builder/new", label: "Resume builder", note: "Templates, colours, PDF and Word export" },
  { href: "/resume-checker", label: "Resume score", note: "ATS score, quality score and keywords" },
  { href: "/tools/bullet-writer", label: "AI resume help", note: "Rewrites, fixer, tailoring and agent" },
  { href: "/tools/cover-letter-writer", label: "Cover letters", note: "AI-written, with designs" },
  { href: "/dashboard/linkedin", label: "LinkedIn optimizer", note: "Rewrite your profile" },
  { href: "/dashboard/interview", label: "Interview practice", note: "AI feedback on your answers" },
  { href: "/dashboard", label: "Resignation letters", note: "Open a resume, then pick Resignation" },
  { href: "/dashboard/applications", label: "Job tracker", note: "Follow every application" },
];

function ServicesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div
      ref={ref}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls="services-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 whitespace-nowrap hover:text-brand-blue transition-colors"
      >
        Services
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-3 w-[460px]">
          <ul id="services-menu" className="grid grid-cols-2 gap-1 bg-white rounded-2xl border border-rule shadow-lg p-2">
            {SERVICES.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="block rounded-xl px-3 py-2.5 hover:bg-sand" onClick={() => setOpen(false)}>
                  <span className="block text-[15px] font-bold text-ink">{s.label}</span>
                  <span className="block text-[13px] font-medium text-ink/60 leading-snug">{s.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PublicNav() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && Boolean(session?.user);
  const initial = (session?.user?.name || session?.user?.email || "?")[0]?.toUpperCase();
  const [open, setOpen] = useState(false);
  const [svcOpen, setSvcOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="relative z-40 bg-cream">
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-4 sm:py-5 flex items-center justify-between gap-3">
        <Logo compact={pathname !== "/"} />
        <nav aria-label="Main" className="hidden lg:flex items-center gap-5 xl:gap-7 text-[15px] font-semibold">
          <ServicesMenu />
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
            onClick={() => { setOpen((o) => !o); setSvcOpen(false); }}
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
          <button
            type="button"
            aria-expanded={svcOpen && open}
            aria-controls="services-mobile"
            onClick={() => setSvcOpen((o) => !o)}
            className="py-3 border-b border-rule/60 flex items-center justify-between text-left"
          >
            Services
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${svcOpen ? "rotate-180" : ""}`}>
              <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {svcOpen &&
            SERVICES.map((s) => (
              <Link key={s.label} href={s.href} className="py-2.5 pl-4 border-b border-rule/60 font-medium text-ink/80" onClick={() => { setOpen(false); setSvcOpen(false); }}>
                {s.label}
              </Link>
            ))}
          {LINKS.map((l) => (
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
