import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getAiUsageSummary } from "@/lib/db";
import {
  AGENT_MONTHLY_CAP,
  FREE_COVER_LETTERS_PER_MONTH,
  MODELS,
  costWithoutSavingsUsd,
  estimateCostUsd,
  monthStartIST,
  type TokenUsage,
} from "@/lib/ai-costs";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminStatCard } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "AI costs | Lettr Admin" };

const FEATURE_LABELS: Record<string, string> = {
  agent: "AI Resume Agent",
  cover_letter: "Cover letters",
  resignation_letter: "Resignation letters",
  bullets: "Bullet rewrites",
  summary: "Summaries",
  import: "Resume imports",
  check: "Free resume checker",
  review: "Review analysis",
};

const usd = (n: number) => (n < 0.01 && n > 0 ? "< $0.01" : `$${n.toFixed(2)}`);
const modelName = (m: string) => (m === MODELS.sonnet ? "Sonnet" : m === MODELS.haiku ? "Haiku" : m);

export default async function AdminAiPage() {
  await requireAdmin();
  const since = monthStartIST();
  const rows = await getAiUsageSummary(since);

  const withCost = rows.map((r) => {
    const u: TokenUsage = {
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      cacheReadTokens: r.cache_read_tokens,
      cacheWriteTokens: r.cache_write_tokens,
    };
    // Rows mix batch and normal requests only for review analysis, which is batch by default.
    const batch = r.batched > 0 && r.batched === r.calls - r.reused;
    const cost = estimateCostUsd(r.model, u, batch);
    const paidCalls = r.calls - r.reused;
    const avg = paidCalls > 0 ? cost / paidCalls : 0;
    // Reused answers would otherwise have cost about the same as an average call.
    const without = costWithoutSavingsUsd(r.model, u) + avg * r.reused;
    return { ...r, cost, without };
  });
  const total = withCost.reduce((a, r) => a + r.cost, 0);
  const without = withCost.reduce((a, r) => a + r.without, 0);
  const reused = rows.reduce((a, r) => a + r.reused, 0);
  const calls = rows.reduce((a, r) => a + r.calls, 0);
  const month = since.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">AI costs</h1>
        <p className="text-slate mb-6">
          {month} so far. Estimated from tokens at list prices; your Anthropic bill is the final word.
        </p>

        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <AdminStatCard label="Estimated cost" value={usd(total)} sub="this month" />
          <AdminStatCard label="Saved" value={usd(Math.max(0, without - total))} sub="caching, reuse and batch" />
          <AdminStatCard label="AI requests" value={String(calls)} />
          <AdminStatCard label="Answered from saved results" value={String(reused)} sub="no AI cost" />
        </div>

        <div className="bg-white border border-rule rounded-[24px] overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate bg-sand">
                {["Feature", "Model", "Requests", "Reused", "Tokens in", "From cache", "Tokens out", "Est. cost"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withCost.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate">No AI use recorded this month yet.</td>
                </tr>
              ) : (
                withCost.map((r) => (
                  <tr key={`${r.feature}-${r.model}`} className="border-t border-rule">
                    <td className="px-4 py-3 font-bold">
                      {FEATURE_LABELS[r.feature] ?? r.feature}
                      {r.batched > 0 && <span className="ml-2 text-[10px] uppercase font-mono text-slate">batch</span>}
                    </td>
                    <td className="px-4 py-3">{modelName(r.model)}</td>
                    <td className="px-4 py-3">{r.calls}</td>
                    <td className="px-4 py-3">{r.reused}</td>
                    <td className="px-4 py-3">{(r.input_tokens + r.cache_write_tokens).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{r.cache_read_tokens.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{r.output_tokens.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-bold">{usd(r.cost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h2 className="font-brand font-extrabold text-lg mb-3">How costs are kept down</h2>
        <ul className="bg-white border border-rule rounded-[24px] p-6 space-y-2 text-sm text-slate list-disc pl-10">
          <li>AI Resume Agent: prompt caching, so follow-up steps read the resume from cache at about a tenth of the price.</li>
          <li>Cover letters: Haiku on the free plan ({FREE_COVER_LETTERS_PER_MONTH} a month), Sonnet on Pro.</li>
          <li>Same resume and job post as before: the saved letter or import is reused for free (kept 30 days).</li>
          <li>
            AI Agent fair use per month: {AGENT_MONTHLY_CAP.full} messages (standard prices), {AGENT_MONTHLY_CAP.mid} (regional),{" "}
            {AGENT_MONTHLY_CAP.value} (value countries, including India).
          </li>
          <li>Review analysis goes through the batch API at half price; replies are emailed when it finishes.</li>
        </ul>
      </main>
    </div>
  );
}
