"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { Logo } from "@/components/Logo";
import { InstallAppButton } from "@/components/AppInstall";
import { signOut } from "next-auth/react";
import { Home, LayoutTemplate, MessageSquare, LifeBuoy, Crown, CreditCard, LogOut, ShieldAlert, Globe, Briefcase, Mic } from "lucide-react";

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
  isPaidPro = false,
  usage,
}: {
  /** Kept for older call sites; the new sidebar always shows the Lettr logo. */
  title?: string;
  eyebrow?: string;
  isAdmin?: boolean;
  plan?: string;
  /** Pro with a real Stripe subscription - gets "Billing" (manage/cancel) instead of the pricing page. */
  isPaidPro?: boolean;
  /** Optional free-plan usage to show in the plan card (e.g. PDF downloads). */
  usage?: SidebarUsage;
}) {
  const pathname = usePathname();
  // Free users are sent to upgrade; paying Pro users manage billing in
  // Stripe (see BillingPortalButton below); Pro added by the team has
  // nothing to manage, so it just shows the plans.
  const NAV_ITEMS = isPaidPro
    ? BASE_NAV_ITEMS
    : [...BASE_NAV_ITEMS, { href: "/pricing", label: plan === "pro" ? "Your plan" : "Upgrade to Pro", icon: Crown }];

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-[15px] transition-colors ${
      active ? "bg-white/10 text-white font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
    }`;

  return (
    <>
      {/* Phones: a compact top bar instead of a sidebar that would eat the whole screen. */}
      <div className="lg:hidden bg-ink text-white">
        <div className="px-4 py-3 flex items-center justify-between">
          <Logo dark href="/" compact />
          <InstallAppButton className="ml-auto mr-2 min-h-10 px-3.5 rounded-full bg-gold text-ink text-sm font-extrabold" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="min-h-11 px-2 text-sm text-white/70 hover:text-white"
          >
            Sign out
          </button>
        </div>
        <nav className="flex gap-1.5 px-3 pb-3 overflow-x-auto whitespace-nowrap">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex items-center min-h-10 px-3.5 rounded-full text-sm shrink-0 ${
                  active ? "bg-white text-ink font-bold" : "text-white/75 bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isPaidPro && (
            <span className="inline-flex items-center min-h-10 px-3.5 rounded-full bg-white/5 shrink-0">
              <BillingPortalButton label="Billing" className="text-sm text-white/75" />
            </span>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center min-h-10 px-3.5 rounded-full text-sm shrink-0 text-white/75 bg-white/5"
            >
              Admin
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center min-h-10 px-3.5 rounded-full text-sm shrink-0 text-white/75 bg-white/5"
          >
            Lettr homepage
          </Link>
        </nav>
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
                <Link key={item.label} href={item.href} className={itemClass(pathname === item.href)}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
            {isPaidPro && (
              <div className={itemClass(false)}>
                <CreditCard className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <BillingPortalButton label="Billing" className="text-[15px] text-inherit hover:text-white" />
              </div>
            )}
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
            <InstallAppButton className={`w-full ${itemClass(false)} !text-gold font-bold`} />
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
