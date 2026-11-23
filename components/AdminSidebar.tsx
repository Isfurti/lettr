"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  LayoutGrid,
  Users,
  BarChart3,
  FileText,
  CreditCard,
  Settings,
  Inbox,
  Star,
  LogOut,
  Receipt,
  Sparkles,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/templates", label: "Templates", icon: FileText },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/ai", label: "AI costs", icon: Sparkles },
  { href: "/admin/system", label: "System", icon: Settings },
  { href: "/admin/support", label: "Support inbox", icon: Inbox },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu when a link takes you to another page.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    fetch("/api/health")
      .then((res) => setHealthy(res.ok))
      .catch(() => setHealthy(false));
  }, []);

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

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const menuItem = (active: boolean) =>
    `flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] transition-colors ${
      active ? "admin-nav-item-active font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
    }`;

  return (
    <>
    {/* Phones and tablets: a slim top bar, with the sections behind the ☰ menu. */}
    <div className="lg:hidden sticky top-0 z-50 bg-admin-sidebar text-white/90">
      <div className="admin-stripe h-1 w-full" />
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="font-brand font-extrabold text-base text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" strokeWidth={2.5} /> Admin
          {healthy !== null && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-green-400" : "bg-red-300"}`}
              aria-label={healthy ? "System healthy" : "System problem"}
            />
          )}
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="admin-menu"
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
            id="admin-menu"
            aria-label="Admin menu"
            className="absolute inset-x-0 top-full bg-admin-sidebar border-t border-white/10 px-3 pt-2 pb-4 max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-2xl"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={menuItem(active)} aria-current={active ? "page" : undefined}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-white/10" />
            <Link href="/dashboard" className={menuItem(false)}>
              <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2} />
              Back to your dashboard
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/" })} className={`w-full ${menuItem(false)}`}>
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
              Sign out
            </button>
          </nav>
        </>
      )}
    </div>
    <aside className="hidden lg:flex w-64 shrink-0 bg-admin-sidebar text-white/90 flex-col min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div className="admin-stripe h-1.5 w-full shrink-0" />

      <div className="px-6 pt-6 pb-5 border-b border-white/10">
        <Logo dark href="/admin" />
        <p className="mt-3 flex w-fit items-center gap-1.5 bg-admin-accent text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2.5} /> Admin
        </p>
        <p className="text-xs text-admin-accent-soft mt-2 font-bold">Real user data. Act carefully.</p>
      </div>

      <nav className="flex-1 px-3 mt-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] transition-colors ${
                active ? "admin-nav-item-active font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 space-y-2">
        <Link
          href="/admin/system"
          className="flex items-center justify-center gap-2 px-3 min-h-11 rounded-full text-sm font-bold bg-admin-accent-deep hover:bg-admin-accent transition-colors"
        >
          <ShieldAlert className="w-4 h-4" strokeWidth={2} />
          System Health
          {healthy !== null && (
            <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-green-400" : "bg-red-300"}`} />
          )}
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          ← Back to your dashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
