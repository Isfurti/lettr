"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  LayoutGrid,
  Users,
  BarChart3,
  FileText,
  CreditCard,
  Settings,
  Inbox,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/templates", label: "Templates", icon: FileText },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
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
    <aside className="w-64 shrink-0 bg-navy-deep text-white/90 flex flex-col min-h-screen">
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-sm bg-seal flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-display font-semibold text-base leading-none text-white">Admin Portal</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">System management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                active ? "sidebar-nav-item-active font-medium" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 space-y-2">
        <Link
          href="/admin/system"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-sm font-medium bg-seal-deep hover:bg-seal transition-colors"
        >
          <ShieldCheck className="w-4 h-4" strokeWidth={2} />
          System Health
          {healthy !== null && (
            <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-green-400" : "bg-red-400"}`} />
          )}
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          ← Back to app
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
