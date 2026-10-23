import { allRegionPriceRows } from "@/lib/plans";
import { currencyAllowed } from "@/lib/razorpay";

/**
 * Every Pro price, for every region, in one table. Admin only: customers
 * only ever see the prices for their own country.
 */
export function RegionPriceTable({ highlight }: { highlight?: string }) {
  const rows = allRegionPriceRows();
  return (
    <div className="bg-white rounded-[24px] border border-rule overflow-x-auto">
      <table className="w-full min-w-[640px] text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule">
            <th className="py-3 px-4 font-extrabold">Region</th>
            <th className="py-3 px-3 font-extrabold text-right whitespace-nowrap">1 month</th>
            <th className="py-3 px-3 font-extrabold text-right whitespace-nowrap">3 months</th>
            <th className="py-3 px-3 font-extrabold text-right whitespace-nowrap">12 months</th>
            <th className="py-3 px-4 font-extrabold">Who pays this</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-b border-rule/60 last:border-0 align-top ${r.id === highlight ? "bg-gold-soft/60" : ""}`}>
              <td className="py-3 px-4 font-bold whitespace-nowrap">
                {r.name}
                <span className="block text-xs font-normal text-slate">
                  {r.prices.currency}
                  {r.prices.taxNote ? " · incl. GST" : ""}
                  {currencyAllowed(r.prices.currency) ? "" : " · payments not open"}
                </span>
              </td>
              <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{r.prices.format(r.prices.monthly)}</td>
              <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{r.prices.format(r.prices.quarter)}</td>
              <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{r.prices.format(r.prices.yearly)}</td>
              <td className="py-3 px-4 text-slate">{r.appliesTo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
