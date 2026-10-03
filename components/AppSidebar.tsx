"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  Mail,
  LayoutTemplate,
  Sparkles,
  LogOut,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
];

export function AppSidebar({
  title = "Lettr",
  eyebrow,
  isAdmin = false,
  plan = "free",
  isPaidPro = false,
}: {
  title?: string;
  eyebrow?: string;
  isAdmin?: boolean;
  plan?: string;
  /** Pro with a real Stripe subscription - gets "Billing" (manage/cancel) instead of the pricing page. */
  isPaidPro?: boolean;
}) {
  const pathname = usePathname();
  // Free users are sent to upgrade; paying Pro users manage billing in
  // Stripe (see BillingPortalButton below); Pro added by the team has
  // nothing to manage, so it just shows the plans.
  const NAV_ITEMS = isPaidPro
    ? BASE_NAV_ITEMS
    : [...BASE_NAV_ITEMS, { href: "/pricing", label: plan === "pro" ? "Your plan" : "Upgrade to Pro", icon: Mail }];

  return (
    <>
    {/* Phones: a compact top bar instead of a 256px sidebar that would eat the whole screen. */}
    <div className="md:hidden bg-navy-deep text-white/90">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-base text-white">{title}</Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-white/60 hover:text-white">
          Sign out
        </button>
      </div>
      <nav className="flex gap-1 px-2 pb-2 overflow-x-auto whitespace-nowrap">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`px-3 py-1.5 rounded-sm text-xs shrink-0 ${active ? "bg-white/10 text-white font-medium" : "text-white/60"}`}
            >
              {item.label}
            </Link>
          );
        })}
        {isPaidPro && (
          <span className="px-3 py-1.5 shrink-0">
            <BillingPortalButton label="Billing" className="text-xs text-white/60" />
          </span>
        )}
        {isAdmin && (
          <Link href="/admin" className="px-3 py-1.5 rounded-sm text-xs shrink-0 text-white/60">Admin</Link>
        )}
      </nav>
    </div>
    <aside className="hidden md:flex w-64 shrink-0 bg-navy-deep text-white/90 flex-col min-h-screen">
      <Link href="/" className="px-6 py-6 flex items-center gap-2.5 hover:opacity-90">
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
        {isPaidPro && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-white/60 hover:text-white hover:bg-white/5">
            <Mail className="w-4 h-4 shrink-0" strokeWidth={2} />
            <BillingPortalButton label="Billing" className="text-sm text-inherit hover:text-white" />
          </div>
        )}
      </nav>

      <div className="px-3 pb-6 space-y-0.5">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm bg-admin-accent-deep hover:bg-admin-accent transition-colors font-medium mb-2"
          >
            <ShieldAlert className="w-4 h-4" strokeWidth={2} />
            Admin Portal
          </Link>
        )}
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
    </>
  );
}
