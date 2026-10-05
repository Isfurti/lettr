import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, isAdminEmail } from "@/lib/admin-auth";
import { listAllUsers, type AdminUserRow } from "@/lib/db";
import { PRICING_TIERS, getDisplayPriceForUser, type PricingTier } from "@/lib/pricing-region";
import { getStripeStatus } from "@/lib/integrations";
import { formatDate } from "@/lib/format-date";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminStatCard, PaymentsWarning } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "Subscriptions | Lettr Admin" };

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const users = await listAllUsers();
  const stripe = getStripeStatus();

  // Only people with a Stripe subscription bring in money. Pro given by an
  // admin ("comp") is listed separately and never counted in revenue.
  const paid = users.filter((u) => u.plan === "pro" && u.stripe_subscription_id);
  const comped = users.filter((u) => u.plan === "pro" && !u.stripe_subscription_id);

  const tierOf = (u: AdminUserRow): PricingTier => getDisplayPriceForUser(u).tier;
  const mrr = paid.reduce((sum, u) => sum + PRICING_TIERS[tierOf(u)].usd, 0);
  const tierCounts: Record<PricingTier, number> = { full: 0, mid: 0, value: 0 };
  for (const u of paid) tierCounts[tierOf(u)] += 1;

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Subscriptions</h1>
        <p className="text-ink-soft text-sm mb-6">
          {paid.length} paying subscriber{paid.length === 1 ? "" : "s"} · {comped.length} comped Pro account
          {comped.length === 1 ? "" : "s"}
        </p>

        {!stripe.ready && <PaymentsWarning missing={stripe.missing} />}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <AdminStatCard
            label="Paying subscribers"
            value={String(paid.length)}
            sub={`${tierCounts.full} standard · ${tierCounts.mid} mid · ${tierCounts.value} value`}
          />
          <AdminStatCard
            label="Monthly revenue (est.)"
            value={`$${mrr}`}
            sub="Paying subscribers only, at their regional price, before Stripe fees"
          />
          <AdminStatCard label="Comped Pro" value={String(comped.length)} sub="Pro for free — no revenue" />
        </div>

        <SubscriberTable title="Paying subscribers" rows={paid} empty="No paying subscribers yet." showStripe />
        <div className="h-8" />
        <SubscriberTable
          title="Comped Pro (given by an admin)"
          rows={comped}
          empty="No comped accounts."
          note={(u) => (isAdminEmail(u.email) ? "your account" : undefined)}
        />

        <p className="text-xs text-ink-soft mt-4">
          Refunds, plan changes and cancellations for paying subscribers happen in Stripe — their plan here updates
          automatically. Comped Pro can be given or removed on each user&apos;s page.
        </p>
      </main>
    </div>
  );
}

function SubscriberTable({
  title,
  rows,
  empty,
  showStripe = false,
  note,
}: {
  title: string;
  rows: AdminUserRow[];
  empty: string;
  showStripe?: boolean;
  note?: (u: AdminUserRow) => string | undefined;
}) {
  return (
    <div className="bg-white border border-rule rounded-xl overflow-x-auto">
      <p className="px-6 py-3 border-b border-rule font-brand font-extrabold">{title}</p>
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-soft bg-sand">
            <th className="px-6 py-3 font-medium">User</th>
            <th className="px-6 py-3 font-medium">Region · price</th>
            <th className="px-6 py-3 font-medium">Joined</th>
            <th className="px-6 py-3 font-medium">{showStripe ? "Stripe" : ""}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-6 text-center text-ink-soft">{empty}</td>
            </tr>
          )}
          {rows.map((u) => (
            <tr key={u.id} className="border-t border-rule">
              <td className="px-6 py-3">
                <Link href={`/admin/users/${u.id}`} className="hover:underline">
                  <p className="font-medium">
                    {u.name || "—"}
                    {note?.(u) && <span className="ml-2 text-[10px] uppercase text-ink-soft">({note(u)})</span>}
                  </p>
                  <p className="text-xs text-ink-soft">{u.email}</p>
                </Link>
              </td>
              <td className="px-6 py-3 text-xs font-mono">
                {u.country_code ? `${u.country_code} · ${getDisplayPriceForUser(u).display}` : "Not detected yet"}
              </td>
              <td className="px-6 py-3 text-ink-soft text-xs">{formatDate(u.created_at)}</td>
              <td className="px-6 py-3">
                {showStripe && u.stripe_customer_id && (
                  <a
                    href={`https://dashboard.stripe.com/customers/${u.stripe_customer_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-admin-accent text-xs hover:underline"
                  >
                    Open in Stripe →
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
