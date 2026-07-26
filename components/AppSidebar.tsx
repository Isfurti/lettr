"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  Mail,
  LayoutTemplate,
  Sparkles,
  LogOut,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/pricing", label: "Subscription", icon: Mail },
];

export function AppSidebar({ title = "Lettr", eyebrow }: { title?: string; eyebrow?: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-navy-deep text-white/90 flex flex-col min-h-screen">
      <Link href="/dashboard" className="px-6 py-6 flex items-center gap-2.5 hover:opacity-90">
        <div className="w-8 h-8 rounded-sm bg-seal flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-display font-semibold text-base leading-none text-white">{title}</p>
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{eyebrow}</p>
          )}
        </div>
      </Link>

      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
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

      <div className="px-3 pb-6 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2} />
          Visit homepage
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
