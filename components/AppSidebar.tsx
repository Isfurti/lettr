"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { InstallAppButton } from "@/components/AppInstall";
import { signOut } from "next-auth/react";
import { Home, LayoutTemplate, MessageSquare, LifeBuoy, Crown, LogOut, ShieldAlert, Globe, Briefcase, Mic, Download, Menu, X } from "lucide-react";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/interview", label: "Interview practice", icon: Mic },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/support", label: "Help", icon: LifeBuoy },
];

/** Free-plan usage shown in the sidebar's plan card. */
export type SidebarUsage = { label: string; used: number; limit: number };

export function AppSidebar({
  isAdmin = false,
  plan = "free",
  usage,
}: {
  /** Kept for older call sites; the new sidebar always shows the Lettr logo. */
  title?: string;
  eyebrow?: string;
  isAdmin?: boolean;
  plan?: string;
  /** Optional free-plan usage to show in the plan card (e.g. PDF downloads). */
  usage?: SidebarUsage;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu when a link takes you to another page.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  // While the menu is open: Escape closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);
  // Free users are sent to upgrade; Pro users see their plan there and can
  // add more time (passes don't renew on their own).
  const NAV_ITEMS = [...BASE_NAV_ITEMS, { href: "/pricing", label: plan === "pro" ? "Your plan" : "Upgrade to Pro", icon: Crown }];

  // "Interview practice" stays highlighted inside one interview, and so on.
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] transition-colors ${
      active ? "bg-white/10 text-white font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
    }`;

  return (
    <>
      {/* Phones and tablets: a slim top bar, with everything else behind the ☰ menu. */}
      <div className="lg:hidden sticky top-0 z-50 bg-ink text-white">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <Logo dark href="/" compact />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="app-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="w-11 h-11 -mr-1.5 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            {menuOpen ? <X className="w-6 h-6" strokeWidth={2.25} /> : <Menu className="w-6 h-6" strokeWidth={2.25} />}
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-16 bg-ink/50"
            />
            <nav
              id="app-menu"
              aria-label="Main menu"
              className="absolute inset-x-0 top-full bg-ink border-t border-white/10 px-3 pt-2 pb-4 max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-2xl"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.label} href={item.href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-white/10" />
              {isAdmin && (
                <Link href="/admin" className={itemClass(false)}>
                  <ShieldAlert className="w-[18px] h-[18px]" strokeWidth={2} />
                  Admin Portal
                </Link>
              )}
              <InstallAppButton
                icon={<Download className="w-[18px] h-[18px]" strokeWidth={2} />}
                label="Install the app"
                onDone={() => setMenuOpen(false)}
                className={`w-full ${itemClass(false)} !text-gold font-bold`}
              />
              <Link href="/" className={itemClass(false)}>
                <Globe className="w-[18px] h-[18px]" strokeWidth={2} />
                Lettr homepage
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className={`w-full ${itemClass(false)}`}>
                <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
                Sign out
              </button>
            </nav>
          </>
        )}
      </div>

      <aside className="hidden lg:block w-64 shrink-0 bg-ink text-white">
        <div className="sticky top-0 h-screen flex flex-col">
          <div className="px-6 pt-6 pb-4">
            <Logo dark href="/" />
          </div>

          <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className={itemClass(isActive(item.href))} aria-current={isActive(item.href) ? "page" : undefined}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-5 space-y-1">
            {plan === "free" && (
              <div className="mb-3 rounded-2xl bg-white/[0.07] border border-white/10 p-4">
                <p className="font-extrabold">Free plan</p>
                {usage && (
                  <>
                    <p className="text-sm text-white/70 mt-1">
                      {Math.max(0, usage.limit - usage.used)} of {usage.limit} {usage.label} left
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full"
                        style={{
                          width: `${Math.min(100, (Math.max(0, usage.limit - usage.used) / usage.limit) * 100)}%`,
                        }}
                      />
                    </div>
                  </>
                )}
                <Link
                  href="/pricing"
                  className="btn-press mt-3 flex items-center justify-center min-h-11 rounded-full bg-gold text-ink font-extrabold shadow-[0_4px_0_var(--gold-deep)]"
                >
                  Go Pro
                </Link>
              </div>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] bg-admin-accent-deep hover:bg-admin-accent transition-colors font-bold mb-1"
              >
                <ShieldAlert className="w-[18px] h-[18px]" strokeWidth={2} />
                Admin Portal
              </Link>
            )}
            <InstallAppButton
              icon={<Download className="w-[18px] h-[18px]" strokeWidth={2} />}
              className={`w-full ${itemClass(false)} !text-gold font-bold`}
            />
            <Link href="/" className={itemClass(false)}>
              <Globe className="w-[18px] h-[18px]" strokeWidth={2} />
              Lettr homepage
            </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className={`w-full ${itemClass(false)}`}>
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
