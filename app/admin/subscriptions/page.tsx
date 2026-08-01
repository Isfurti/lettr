import { requireAdmin } from "@/lib/admin-auth";
import { listAllUsers } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";
import { PRICING_TIERS, type PricingTier } from "@/lib/pricing-region";

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const users = await listAllUsers();
  const proUsers = users.filter((u) => u.plan === "pro");

  // Each subscriber's real tier-adjusted price, not a flat assumption -
  // this used to hardcode $19 × count, which became wrong the moment
  // regional pricing existed.
  function usdForUser(u: (typeof proUsers)[number]): number {
    const tier = (u.pricing_tier as PricingTier) || "full";
    return PRICING_TIERS[tier]?.usd ?? PRICING_TIERS.full.usd;
  }
  const mrr = proUsers.reduce((sum, u) => sum + usdForUser(u), 0);

  const tierCounts: Record<PricingTier, number> = { full: 0, mid: 0, value: 0 };
  for (const u of proUsers) {
    const tier = (u.pricing_tier as PricingTier) || "full";
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
  }

  return (
    <div className="flex-1 flex admin-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-6xl">
        <h1 className="font-display font-semibold text-3xl mb-1">Subscriptions</h1>
        <p className="text-ink-soft mb-8">{proUsers.length} active Pro subscriber{proUsers.length === 1 ? "" : "s"}.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-admin-accent">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">Pro subscribers</p>
            <p className="font-display font-semibold text-2xl">{proUsers.length}</p>
            <p className="text-xs text-ink-soft mt-1">
              {tierCounts.full} standard · {tierCounts.mid} regional (mid) · {tierCounts.value} regional (value)
            </p>
          </div>
          <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-admin-accent">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">Estimated MRR</p>
            <p className="font-display font-semibold text-2xl">${mrr}</p>
            <p className="text-xs text-ink-soft mt-1">
              Computed per-subscriber from their actual pricing tier (USD-equivalent for India&apos;s INR
              pricing) — before any Stripe fees, discounts, or churn this month.
            </p>
          </div>
        </div>

        <div className="paper-sheet rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft bg-app-bg">
                <th className="px-6 py-3 font-medium">Subscriber</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium">Since</th>
                <th className="px-6 py-3 font-medium">Manage</th>
              </tr>
            </thead>
            <tbody>
              {proUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-soft">
                    No Pro subscribers yet.
                  </td>
                </tr>
              )}
              {proUsers.map((u) => (
                <tr key={u.id} className="border-t border-rule">
                  <td className="px-6 py-3">
                    <p className="font-medium">{u.name || "—"}</p>
                    <p className="text-xs text-ink-soft">{u.email}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-mono uppercase bg-admin-accent-soft text-admin-accent-deep px-2 py-0.5 rounded-sm">
                      {u.pricing_tier || "full"}{u.country_code ? ` · ${u.country_code}` : ""}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-ink-soft text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <a
                      href="https://dashboard.stripe.com/customers"
                      target="_blank"
                      rel="noreferrer"
                      className="text-admin-accent text-xs hover:underline"
                    >
                      View in Stripe →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-soft mt-3">
          Refunds, plan changes, and cancellations happen in Stripe directly — this page is read-only by design, so billing state can&apos;t drift out of sync with what Stripe actually charged.
        </p>
      </main>
    </div>
  );
}
