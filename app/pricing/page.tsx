import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { PublicNav } from "@/components/PublicNav";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { getCountryFromHeaders } from "@/lib/pricing-region";
import { TEMPLATE_IDS } from "@/lib/templates";
import { getRegionPrices, savingsPercent, perMonth, type PlanId } from "@/lib/plans";
import { ensureUserRegion } from "@/lib/user-region";

export const metadata: Metadata = {
  title: "Pricing | Lettr — Free AI Resume Builder",
  description: "Free resume builder with AI bullet rewriting and resume scoring. Upgrade to Pro for cover letters, unlimited exports, and more.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Lettr Pricing — Free to start, upgrade anytime",
    description: "Free resume builder with AI writing tools. Pro unlocks cover letters, resignation letters, and unlimited exports. Regional pricing available.",
    url: "/pricing",
  },
};

const COMPARISON: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: "Resumes", free: "1", pro: "Unlimited" },
  { feature: "Templates", free: "2 (Classic, Modern)", pro: `All ${TEMPLATE_IDS.length}` },
  { feature: "PDF downloads", free: "3", pro: "Unlimited" },
  { feature: "AI bullet & summary rewriting", free: "5 total", pro: "Unlimited" },
  { feature: "AI Resume Agent (chat editing)", free: false, pro: true },
  { feature: "Resume quality score", free: "Score + next best fix", pro: "Full breakdown" },
  { feature: "Job match / keyword targeting", free: true, pro: true },
  { feature: "AI cover letter builder", free: false, pro: true },
  { feature: "AI resignation letter builder", free: false, pro: true },
  { feature: "DOCX export", free: false, pro: true },
  { feature: "Google Drive export", free: false, pro: true },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel from your dashboard at any time and keep Pro until the end of the period you already paid for.",
  },
  {
    q: "How does the resume score work?",
    a: "It's a real, deterministic check of your resume's structure — contact completeness, summary quality, whether your bullets use strong action verbs and quantified results, education, and skill count. It's not a black box: the Score tab tells you exactly what to fix next.",
  },
  {
    q: "What does the AI actually rewrite?",
    a: "Bullet points, your summary, cover letters, and resignation letters, generated fresh each time from your real experience — not filled-in templates.",
  },
  {
    q: "What's the difference between the Pro plans?",
    a: "Nothing in what you get: Monthly, the 3-month pass and Yearly all unlock every Pro feature. The longer plans just cost less per month.",
  },
  {
    q: "When can I buy Pro?",
    a: "Pro opens at launch. Until then, the free plan is fully usable, and your resumes will carry over when you upgrade.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — 1 resume, 2 templates, 3 PDF downloads, and 5 free AI bullet/summary rewrites, no credit card required.",
  },
];

export default async function PricingPage() {
  // Everyone sees the price for their region. Signed-in users see their
  // SAVED tier (what checkout will actually charge); if they don't have one
  // yet (Google/LinkedIn signups, older accounts) it's detected and saved
  // now. Logged-out visitors see a live preview for where they're browsing from.
  const session = await auth();
  const headersList = await headers();
  let prices = getRegionPrices(getCountryFromHeaders(headersList));

  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    const user = await getUserById(userId);
    if (user) {
      const withRegion = await ensureUserRegion(user, headersList);
      if (withRegion.country_code || withRegion.pricing_tier) {
        prices = getRegionPrices(withRegion.country_code, withRegion.pricing_tier);
      }
    }
  }

  const PRO_PLANS: { id: PlanId; name: string; price: number; period: string; blurb: string; badge?: string }[] = [
    { id: "monthly", name: "Monthly", price: prices.monthly, period: "/ month", blurb: "Flexible. Cancel any time." },
    {
      id: "quarter",
      name: "3-month pass",
      price: prices.quarter,
      period: "/ 3 months",
      blurb: "Made for one focused job search.",
      badge: "Most popular",
    },
    {
      id: "yearly",
      name: "Yearly",
      price: prices.yearly,
      period: "/ year",
      blurb: "For your whole career year.",
      badge: "Best value",
    },
  ];

  const H2 = "font-brand font-extrabold text-[32px] sm:text-[44px] leading-[1.05] tracking-tight";

  return (
    <main className="flex-1 bg-cream text-ink">
      <PublicNav />
      <section className="max-w-3xl mx-auto w-full px-4 sm:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center rise">
        <p className="inline-flex items-center gap-2 bg-gold-soft text-sm font-bold px-3.5 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-gold-deep" aria-hidden="true" />
          Priced for your country
        </p>
        <h1 className="font-brand font-extrabold text-[40px] sm:text-[60px] leading-[1.02] tracking-tight">
          Start free. Upgrade when it&apos;s worth it.
        </h1>
        <p className="mt-5 text-slate text-lg max-w-xl mx-auto">
          Everything you need for one strong resume is free. Pro unlocks the AI writing tools and unlimited downloads.
        </p>
      </section>

      <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 pb-20 sm:pb-24">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          <Reveal className="bg-white border-2 border-rule rounded-[32px] p-7 flex flex-col">
            <h2 className="font-brand font-extrabold text-2xl">Free</h2>
            <p className="mt-1 min-h-[3rem] text-slate">For one strong resume.</p>
            <div className="mt-3 mb-[3.25rem]">
              <span className="font-brand font-extrabold text-[40px] leading-none">{prices.format(0)}</span>
              <span className="text-sm text-slate font-bold"> / forever</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <FeatureLine included>1 resume</FeatureLine>
              <FeatureLine included>Classic and Modern templates</FeatureLine>
              <FeatureLine included>3 PDF downloads</FeatureLine>
              <FeatureLine included>5 AI rewrites</FeatureLine>
              <FeatureLine included>Job match and resume score</FeatureLine>
            </ul>
            <Link
              href="/signup"
              className="btn-press flex items-center justify-center w-full min-h-12 rounded-full border-2 border-ink font-bold"
            >
              Start free
            </Link>
          </Reveal>

          {PRO_PLANS.map((plan, i) => {
            const best = plan.id === "quarter";
            const save = savingsPercent(prices, plan.id);
            return (
              <Reveal
                key={plan.id}
                delay={(i + 1) * 80}
                className={`relative rounded-[32px] p-7 flex flex-col ${
                  best ? "bg-ink text-white shadow-[8px_8px_0_var(--gold)]" : "bg-white border-2 border-ink shadow-[6px_6px_0_var(--ink)]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 right-6 bg-gold text-ink text-xs font-extrabold px-3 py-1.5 rounded-full rotate-[4deg]">
                    {plan.badge}
                  </span>
                )}
                <h2 className="font-brand font-extrabold text-2xl flex items-center gap-2">
                  Pro <span className={best ? "text-gold" : "text-brand-blue"}>{plan.name}</span>
                </h2>
                <p className={`mt-1 min-h-[3rem] ${best ? "text-white/70" : "text-slate"}`}>{plan.blurb}</p>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-brand font-extrabold text-[40px] leading-none">{prices.format(plan.price)}</span>
                  <span className={`text-sm font-bold whitespace-nowrap ${best ? "text-white/70" : "text-slate"}`}>{plan.period}</span>
                </div>
                <p className={`mt-2 mb-6 text-sm font-bold h-5 ${best ? "text-gold" : "text-brand-blue"}`}>
                  {plan.id === "monthly"
                    ? ""
                    : `${prices.format(perMonth(prices, plan.id))} a month${save > 0 ? ` · save ${save}%` : ""}`}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  <FeatureLine included dark={best}>Everything in Free</FeatureLine>
                  <FeatureLine included dark={best}>Unlimited resumes and PDFs</FeatureLine>
                  <FeatureLine included dark={best}>All {TEMPLATE_IDS.length} templates</FeatureLine>
                  <FeatureLine included dark={best}>Unlimited AI writing</FeatureLine>
                  <FeatureLine included dark={best}>AI Resume Agent</FeatureLine>
                  <FeatureLine included dark={best}>Cover &amp; resignation letters</FeatureLine>
                  <FeatureLine included dark={best}>Word &amp; Google Drive export</FeatureLine>
                </ul>
                <button
                  type="button"
                  disabled
                  className={`w-full min-h-12 rounded-full font-extrabold cursor-not-allowed ${
                    best ? "bg-gold/90 text-ink" : "bg-sand text-slate border-2 border-rule"
                  }`}
                >
                  Opens at launch
                </button>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-8 text-center text-slate">
          Pro opens soon. Until then, everything on the free plan is yours to use.
          {prices.taxNote ? ` ${prices.taxNote}` : ""}
        </p>
      </section>

      <section className="bg-sand border-y border-rule">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-16 sm:py-20">
          <Reveal className="text-center mb-10">
            <h2 className={H2}>Compare plans</h2>
            <p className="mt-3 text-slate text-lg">Every feature, side by side.</p>
          </Reveal>
          <Reveal className="bg-white rounded-[28px] border border-rule overflow-hidden">
            <table className="w-full text-left border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-rule">
                  <th className="py-4 px-4 sm:px-6 w-1/2 font-extrabold">Feature</th>
                  <th className="py-4 px-3 text-center font-extrabold">Free</th>
                  <th className="py-4 px-3 text-center font-extrabold bg-gold-soft">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-rule/60 last:border-0">
                    <td className="py-4 px-4 sm:px-6 font-bold">{row.feature}</td>
                    <td className="py-4 px-3 text-center text-slate">
                      {typeof row.free === "boolean" ? (row.free ? <Check /> : <Dash />) : row.free}
                    </td>
                    <td className="py-4 px-3 text-center font-bold bg-gold-soft/60">
                      {typeof row.pro === "boolean" ? (row.pro ? <Check /> : <Dash />) : row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10">
          <Reveal>
            <h2 className={H2}>Questions</h2>
            <p className="mt-3 text-slate">
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="/support" className="font-bold text-brand-blue hover:underline">
                Ask us
              </Link>
              .
            </p>
          </Reveal>
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-rule open:border-ink transition-colors">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 min-h-14 px-5 py-4 font-bold text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center text-xl font-extrabold transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-slate leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 pb-16 sm:pb-24">
        <div className="relative overflow-hidden bg-brand-blue text-white rounded-[36px] px-6 sm:px-14 py-14 sm:py-20 text-center">
          <span aria-hidden="true" className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-gold/25" />
          <h2 className="relative font-brand font-extrabold text-[34px] sm:text-[52px] leading-[1.02] tracking-tight">
            Ready to write your next chapter?
          </h2>
          <Link
            href="/signup"
            className="relative btn-press mt-8 inline-flex items-center min-h-12 px-8 rounded-full bg-gold text-ink font-extrabold shadow-[0_5px_0_var(--gold-deep)]"
          >
            Create your free resume
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Check() {
  return (
    <svg className="inline-block" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Included">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Dash() {
  return <span aria-label="Not included" className="text-slate/50">—</span>;
}

function FeatureLine({ children, included, dark }: { children: React.ReactNode; included?: boolean; dark?: boolean }) {
  return (
    <li className={`flex items-start gap-3 ${included ? "" : dark ? "text-white/40" : "text-slate/60"}`}>
      {included ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dark ? "var(--gold)" : "var(--brand-blue)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-[3px]">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <span aria-hidden="true" className="w-[18px] shrink-0 text-center">–</span>
      )}
      {children}
    </li>
  );
}
