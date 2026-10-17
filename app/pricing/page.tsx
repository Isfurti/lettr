import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { PublicNav } from "@/components/PublicNav";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { getCountryFromHeaders, getTierForCountry } from "@/lib/pricing-region";
import { TEMPLATE_IDS } from "@/lib/templates";
import { getRegionPrices, savingsPercent, perMonth, type PlanId } from "@/lib/plans";
import { agentMonthlyCap } from "@/lib/ai-costs";
import { ProPlanPicker, type PickerPlan } from "@/components/ProPlanPicker";
import type { CheckoutState } from "@/components/ProCheckoutButton";
import { currencyAllowed, razorpayConfigured } from "@/lib/razorpay";
import { formatProDate, hasPaidPro } from "@/lib/pro-pass";
import { ensureUserRegion } from "@/lib/user-region";
import { DAILY_LIMITS, PLAN_LIMITS } from "@/lib/limits";

const PLAN_LIMITS_DAILY_PRO = DAILY_LIMITS.pro;

export const metadata: Metadata = {
  title: "Pricing | Lettr — Free AI Resume Builder",
  description: "Free resume builder with a live ATS score and a free try of every AI tool. Upgrade to Pro for unlimited AI writing, clean PDFs and exports.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Lettr Pricing — Free to start, upgrade anytime",
    description: "Build and score your resume free, and try every AI tool once. Pro adds unlimited AI writing, clean PDFs, every template and exports. Regional pricing available.",
    url: "/pricing",
  },
};

const FREE = PLAN_LIMITS.free;
const PRO = PLAN_LIMITS.pro;

const COMPARISON: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: "Resumes", free: String(FREE.maxResumes), pro: "Unlimited" },
  { feature: "Templates", free: "2 (Classic, Modern)", pro: `All ${TEMPLATE_IDS.length}` },
  { feature: "PDF downloads", free: "First one clean, then with a small Lettr line", pro: "Unlimited, no branding" },
  { feature: "Word (.docx) and Google Drive export", free: false, pro: true },
  { feature: "Live ATS score", free: true, pro: true },
  { feature: "Missing keywords for a job post", free: `First ${FREE.keywordsShown}`, pro: "All of them" },
  { feature: "Resume quality score", free: "Score + next best fix", pro: "Full breakdown" },
  { feature: "AI bullet & summary rewriting", free: `${FREE.maxAiWritingAssists} free`, pro: "Unlimited" },
  { feature: "AI cover letters", free: `${FREE.coverLetters} free`, pro: "Unlimited, best writing model" },
  { feature: "ATS analyst (AI advice and rewrites)", free: `${FREE.atsAnalyst} free`, pro: `${PRO.atsAnalyst} a month` },
  { feature: "Interview practice with AI feedback", free: `${FREE.interviewSets} free interview`, pro: `${PRO.interviewSets} a month` },
  { feature: "AI Resume Agent (chat editing)", free: false, pro: true },
  { feature: "AI resignation letters", free: false, pro: true },
  { feature: "Job application tracker", free: `Up to ${FREE.trackedJobs} jobs`, pro: "Unlimited" },
  { feature: "Any accent colour", free: "8 preset colours", pro: "Any colour" },
];

const faqs = (open: boolean) => [
  {
    q: "Does Pro renew automatically?",
    a: "No. Every plan is a one-time payment for 1, 3 or 12 months, so there's nothing to cancel and you're never charged again by surprise. We email you a few days before Pro ends. Buy another pass any time and the new months are added after the time you have left.",
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
  open
    ? {
        q: "How can I pay?",
        a: "Through Razorpay, with UPI (Google Pay, PhonePe, Paytm and others), debit or credit cards, netbanking or wallets. You get a GST invoice on your dashboard straight after paying.",
      }
    : {
        q: "When can I buy Pro?",
        a: "Pro opens at launch. Until then, the free plan works as described, and your resumes will carry over when you upgrade.",
      },
  {
    q: "Is there a free plan?",
    a: `Yes. 1 resume, 2 templates, the live ATS score, a clean PDF download, and a free try of every AI tool: ${FREE.maxAiWritingAssists} rewrites, a cover letter, an ATS analyst review and a practice interview. No credit card needed.`,
  },
  {
    q: "What does \"free once\" mean?",
    a: "Each AI tool can be tried free once per person, not once per account, so please don't make extra accounts. After that, Pro unlocks it. Free accounts made before 7 October 2026 keep the monthly allowances they signed up with.",
  },
  {
    q: "Do you offer refunds?",
    a: "There's no money-back guarantee for now, so please try the free plan first. If you're charged twice or by mistake, tell us within 7 days and we'll refund it. Passes don't renew, so you won't be charged again unless you buy another one.",
  },
  {
    q: "Is Pro really unlimited?",
    a: `For normal job hunting, yes. To keep AI costs fair, every account has a daily limit, for example ${PLAN_LIMITS_DAILY_PRO.rewrite} AI rewrites, ${PLAN_LIMITS_DAILY_PRO.cover_letter} cover letters and ${PLAN_LIMITS_DAILY_PRO.agent} AI Agent messages a day on Pro. Limits reset at midnight India time.`,
  },
  {
    q: "Can I keep downloading PDFs on the free plan?",
    a: "Yes. Your first PDF is clean. After that, free PDFs have a small \"Made with Lettr\" line at the bottom of the page. Pro removes it.",
  },
];

export default async function PricingPage() {
  // Everyone sees the price for their region. Signed-in users see their
  // SAVED tier (what checkout will actually charge); if they don't have one
  // yet (Google/LinkedIn signups, older accounts) it's detected and saved
  // now. Logged-out visitors see a live preview for where they're browsing from.
  const session = await auth();
  const headersList = await headers();
  const visitorCountry = getCountryFromHeaders(headersList);
  let prices = getRegionPrices(visitorCountry);
  let tier: string = getTierForCountry(visitorCountry);
  let compedPro = false;
  let proUntil: string | null = null;

  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    const user = await getUserById(userId);
    if (user) {
      const withRegion = await ensureUserRegion(user, headersList);
      if (withRegion.country_code || withRegion.pricing_tier) {
        prices = getRegionPrices(withRegion.country_code, withRegion.pricing_tier);
        tier = withRegion.pricing_tier ?? getTierForCountry(withRegion.country_code);
      }
      compedPro = withRegion.plan === "pro" && !withRegion.pro_until;
      if (hasPaidPro(withRegion) && withRegion.pro_until) proUntil = formatProDate(withRegion.pro_until);
    }
  }

  const checkout: CheckoutState = !razorpayConfigured()
    ? "closed"
    : !currencyAllowed(prices.currency)
    ? "unavailable"
    : !session?.user
    ? "signed-out"
    : compedPro
    ? "comped"
    : "ready";
  const paymentsOpen = checkout !== "closed";

  const months = { monthly: 1, quarter: 3, yearly: 12 } as const;
  const pickerPlans: PickerPlan[] = (
    [
      { id: "monthly", tab: "Monthly", name: "1 month", blurb: "A quick push. Pay once, no renewal.", amount: prices.monthly, period: "for 1 month", addLabel: "Add 1 month" },
      { id: "quarter", tab: "3 months", name: "3 months", blurb: "Made for one focused job search.", amount: prices.quarter, period: "for 3 months", addLabel: "Add 3 months" },
      { id: "yearly", tab: "Yearly", name: "12 months", blurb: "For your whole career year.", amount: prices.yearly, period: "for 12 months", addLabel: "Add 12 months" },
    ] as const
  ).map((p) => {
    const saved = prices.monthly * months[p.id] - p.amount;
    return {
      id: p.id,
      tab: p.tab,
      name: p.name,
      blurb: p.blurb,
      price: prices.format(p.amount),
      period: p.period,
      note:
        p.id === "monthly"
          ? ""
          : `${prices.format(perMonth(prices, p.id))} a month${saved > 0 ? ` · you save ${prices.format(saved)}` : ""}`,
      savePercent: savingsPercent(prices, p.id as PlanId),
      addLabel: p.addLabel,
    };
  });

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
          Build, score and download one strong resume free, and try every AI tool once. Pro unlocks unlimited AI and clean
          downloads.
        </p>
      </section>

      <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 pb-20 sm:pb-24">
        <ProPlanPicker plans={pickerPlans} templateCount={TEMPLATE_IDS.length} checkout={checkout} proUntil={proUntil}>
          <Reveal className="bg-white border-2 border-rule rounded-[32px] p-7 flex flex-col h-full">
            <h2 className="font-brand font-extrabold text-2xl">Free</h2>
            <p className="mt-1 text-slate">For one strong resume.</p>
            <div className="mt-4 mb-8">
              <span className="font-brand font-extrabold text-[40px] leading-none">{prices.format(0)}</span>
              <span className="text-sm text-slate font-bold"> / forever</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <FeatureLine included>1 resume, Classic and Modern templates</FeatureLine>
              <FeatureLine included>Live ATS score and resume score</FeatureLine>
              <FeatureLine included>1 clean PDF, then with a small Lettr line</FeatureLine>
              <FeatureLine included>Try every AI tool once</FeatureLine>
              <FeatureLine included>Track up to {FREE.trackedJobs} jobs</FeatureLine>
            </ul>
            <Link
              href="/signup"
              className="btn-press flex items-center justify-center w-full min-h-12 rounded-full border-2 border-ink font-bold"
            >
              Start free
            </Link>
          </Reveal>
        </ProPlanPicker>
        <p className="mt-8 text-center text-slate">
          {checkout === "closed"
            ? "Pro opens soon. Until then, everything in the free plan is yours to use."
            : checkout === "unavailable"
            ? "Pro can be bought from India for now. Everything in the free plan is yours to use."
            : "Secure payments by Razorpay. GST invoice on your dashboard after paying."}
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
                {COMPARISON.map((r) =>
                  // The AI Agent's fair-use limit depends on the price region.
                  r.feature.startsWith("AI Resume Agent") ? { ...r, pro: `Up to ${agentMonthlyCap(tier)} messages a month` } : r
                ).map((row) => (
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
            {faqs(paymentsOpen).map((f) => (
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
