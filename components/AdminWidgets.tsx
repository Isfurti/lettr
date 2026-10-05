import Link from "next/link";
import { formatDate } from "@/lib/format-date";

export function AdminStatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-rule rounded-[24px] p-5">
      <p className="text-sm font-bold text-slate mb-1">{label}</p>
      <p className="font-brand font-extrabold text-[32px] leading-tight tracking-tight">{value}</p>
      {sub && <p className="text-sm text-slate mt-1">{sub}</p>}
    </div>
  );
}

/** Weekly signups as simple bars. Empty weeks are filled in so the timeline reads correctly. */
export function SignupsChart({ weeks, totalWeeks = 12 }: { weeks: { week: string; count: number }[]; totalWeeks?: number }) {
  const byWeek = new Map(weeks.map((w) => [w.week, w.count]));
  const monday = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = (x.getUTCDay() + 6) % 7;
    x.setUTCDate(x.getUTCDate() - day);
    return x;
  };
  const start = monday(new Date());
  const series = Array.from({ length: totalWeeks }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - 7 * (totalWeeks - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { week: key, count: byWeek.get(key) ?? 0 };
  });
  const max = Math.max(1, ...series.map((w) => w.count));
  const total = series.reduce((s, w) => s + w.count, 0);

  return (
    <div className="bg-white border border-rule rounded-[24px] p-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="font-brand font-extrabold text-xl">Sign-ups per week</p>
        <p className="text-xs text-ink-soft">{total} in the last {totalWeeks} weeks</p>
      </div>
      <div className="flex items-end gap-1.5 h-40">
        {series.map((w) => (
          <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-ink-soft font-mono">{w.count > 0 ? w.count : ""}</span>
            <div
              className={`w-full rounded-t-md ${w.count > 0 ? "bg-brand-blue" : "bg-sand"}`}
              style={{ height: `${w.count > 0 ? Math.max(6, (w.count / max) * 110) : 2}px` }}
              title={`Week of ${formatDate(w.week)}: ${w.count} signup${w.count === 1 ? "" : "s"}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-ink-soft font-mono mt-2">
        <span>{formatDate(series[0].week)}</span>
        <span>this week</span>
      </div>
    </div>
  );
}

/** Red banner shown across the admin portal while payments can't be taken. */
export function PaymentsWarning({ missing }: { missing: string[] }) {
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p className="font-medium">Payments are not set up — nobody can upgrade to Pro right now.</p>
      <p className="text-xs mt-1">
        Add these in Vercel → Project → Settings → Environment Variables, then redeploy:{" "}
        <span className="font-mono">{missing.join(", ")}</span>.{" "}
        <Link href="/admin/system" className="underline">See System →</Link>
      </p>
    </div>
  );
}

export function PlanBadge({ plan, paid }: { plan: string; paid: boolean }) {
  if (plan !== "pro") return <span className="whitespace-nowrap text-xs font-mono uppercase px-2 py-0.5 rounded-xl bg-sand">Free</span>;
  return paid ? (
    <span className="whitespace-nowrap text-xs font-mono uppercase px-2 py-0.5 rounded-xl bg-green-50 text-green-800">Pro · paid</span>
  ) : (
    <span
      title="Pro given by an admin - no Stripe subscription, no revenue"
      className="whitespace-nowrap text-xs font-mono uppercase px-2 py-0.5 rounded-xl bg-amber-50 text-amber-800"
    >
      Pro · comp
    </span>
  );
}
