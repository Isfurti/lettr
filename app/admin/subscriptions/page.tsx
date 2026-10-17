import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, isAdminEmail } from "@/lib/admin-auth";
import { listAllUsers, paymentTotals, type AdminUserRow } from "@/lib/db";
import { getTierForCountry, type PricingTier } from "@/lib/pricing-region";
import { monthlyPriceForUser } from "@/lib/plans";
import { formatMoney } from "@/lib/gst";
import { formatProDate, PRO_PASSES, isPlanId } from "@/lib/pro-pass";
import { getPaymentsStatus } from "@/lib/integrations";
import { formatDate } from "@/lib/format-date";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminStatCard, PaymentsWarning } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "Subscriptions | Lettr Admin" };

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const users = await listAllUsers();
  const payments = getPaymentsStatus();
  const totals = await paymentTotals(30);

  // Only people who bought a Pro pass bring in money. Pro given by an admin
  // ("comp") is listed separately and never counted in revenue.
  const paid = users.filter((u) => u.paid_pro);
  const comped = users.filter((u) => u.plan === "pro" && !u.paid_pro);

  const tierOf = (u: AdminUserRow): PricingTier => {
    const saved = u.pricing_tier;
    return saved === "full" || saved === "mid" || saved === "value" ? saved : getTierForCountry(u.country_code);
  };
  const revenue = totals.length ? totals.map((t) => formatMoney(t.total, t.currency)).join(" + ") : "₹0";
  const sales = totals.reduce((n, t) => n + t.count, 0);
  const tierCounts: Record<PricingTier, number> = { full: 0, mid: 0, value: 0 };
  for (const u of paid) tierCounts[tierOf(u)] += 1;

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Subscriptions</h1>
        <p className="text-ink-soft text-sm mb-6">
          {paid.length} on a paid Pro pass · {comped.length} comped Pro account
          {comped.length === 1 ? "" : "s"}
        </p>

        {!payments.ready && <PaymentsWarning missing={payments.missing} partlyReady={payments.partlyReady} />}
        {payments.testMode && (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Razorpay is using <b>test keys</b>: checkouts work, but no real money is taken. Switch to live keys in Vercel at launch.
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <AdminStatCard
            label="On paid Pro"
            value={String(paid.length)}
            sub={`${tierCounts.full} standard · ${tierCounts.mid} mid · ${tierCounts.value} value`}
          />
          <AdminStatCard
            label="Revenue, last 30 days"
            value={revenue}
            sub={`${sales} pass${sales === 1 ? "" : "es"} sold, including GST, before Razorpay fees.`}
          />
          <AdminStatCard label="Comped Pro" value={String(comped.length)} sub="Pro for free — no revenue" />
        </div>

        <SubscriberTable title="Paid Pro" rows={paid} empty="Nobody has bought Pro yet." showPass />
        <div className="h-8" />
        <SubscriberTable
          title="Comped Pro (given by an admin)"
          rows={comped}
          empty="No comped accounts."
          note={(u) => (isAdminEmail(u.email) ? "your account" : undefined)}
        />

        <p className="text-xs text-ink-soft mt-4">
          Passes don&apos;t renew, so there&apos;s nothing to cancel. Refunds are made in the{" "}
          <a href="https://dashboard.razorpay.com/app/payments" target="_blank" rel="noreferrer" className="underline">
            Razorpay dashboard
          </a>
          ; to take Pro away after a refund, use &quot;Remove Pro&quot; on the user&apos;s page. Comped Pro can be given or removed there too.
        </p>
      </main>
    </div>
  );
}

function SubscriberTable({
  title,
  rows,
  empty,
  showPass = false,
  note,
}: {
  title: string;
  rows: AdminUserRow[];
  empty: string;
  showPass?: boolean;
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
            <th className="px-6 py-3 font-medium">{showPass ? "Pass · ends" : ""}</th>
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
                {u.country_code ? `${u.country_code} · ${monthlyPriceForUser(u).label}` : "Not detected yet"}
              </td>
              <td className="px-6 py-3 text-ink-soft text-xs">{formatDate(u.created_at)}</td>
              <td className="px-6 py-3">
                {showPass && u.pro_until && (
                  <span className="text-xs">
                    {isPlanId(u.pro_plan) ? PRO_PASSES[u.pro_plan].name : "Pass"} · {formatProDate(u.pro_until)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
