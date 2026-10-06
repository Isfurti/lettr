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

  useEffect(() => {
    fetch("/api/health")
      .then((res) => setHealthy(res.ok))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <>
    {/* Phones: compact top bar with scrollable section links instead of the 256px sidebar. */}
    <div className="lg:hidden bg-admin-sidebar text-white/90">
      <div className="admin-stripe h-1 w-full" />
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="font-brand font-extrabold text-base text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" strokeWidth={2.5} /> Admin
          {healthy !== null && (
            <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-green-400" : "bg-red-300"}`} />
          )}
        </span>
        <Link href="/dashboard" className="min-h-11 inline-flex items-center text-sm text-white/70 hover:text-white">← Dashboard</Link>
      </div>
      <nav className="flex gap-1 px-2 pb-2 overflow-x-auto whitespace-nowrap">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center min-h-10 px-3.5 rounded-full text-sm shrink-0 ${pathname === item.href ? "bg-white text-admin-sidebar font-bold" : "text-white/75 bg-white/5"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
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
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
