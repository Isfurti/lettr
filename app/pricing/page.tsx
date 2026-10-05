import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { PublicNav } from "@/components/PublicNav";
import { UpgradeButton } from "@/components/UpgradeButton";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { getCountryFromHeaders, getDisplayPriceForCountry, getDisplayPriceForUser } from "@/lib/pricing-region";
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
  { feature: "Templates", free: "2 (Classic, Modern)", pro: "All 10" },
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
    a: "Yes. Pro is billed monthly and can be cancelled anytime from your dashboard's billing portal. You keep Pro access until the end of the billing period you already paid for.",
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
  let regionalPrice = getDisplayPriceForCountry(getCountryFromHeaders(headersList));

  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    const user = await getUserById(userId);
    if (user) {
      const withRegion = await ensureUserRegion(user, headersList);
      if (withRegion.country_code || withRegion.pricing_tier) {
        regionalPrice = getDisplayPriceForUser(withRegion);
      }
    }
  }

  // Show Free in the same currency as Pro, so the page never mixes "$0" with "₹399".
  const currencySymbol = regionalPrice.display.match(/^[^\d]+/)?.[0] ?? "$";

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

      <section className="max-w-5xl mx-auto w-full px-4 sm:px-8 pb-20 sm:pb-24">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <Reveal className="bg-white border-2 border-rule rounded-[32px] p-7 sm:p-10 flex flex-col">
            <h2 className="font-brand font-extrabold text-3xl">Free</h2>
            <p className="mt-1 text-slate">For one strong resume.</p>
            <div className="mt-6 mb-8">
              <span className="font-brand font-extrabold text-5xl">{currencySymbol}0</span>
              <span className="text-slate font-bold"> / forever</span>
            </div>
            <ul className="space-y-3.5 mb-10 flex-1">
              <FeatureLine included>1 resume</FeatureLine>
              <FeatureLine included>2 templates (Classic, Modern)</FeatureLine>
              <FeatureLine included>3 PDF downloads</FeatureLine>
              <FeatureLine included>AI bullet &amp; summary writing (5 free)</FeatureLine>
              <FeatureLine included>Job match and resume score</FeatureLine>
              <FeatureLine>AI Resume Agent</FeatureLine>
              <FeatureLine>Cover &amp; resignation letters</FeatureLine>
              <FeatureLine>DOCX / Google Drive export</FeatureLine>
            </ul>
            <Link
              href="/signup"
              className="btn-press flex items-center justify-center w-full min-h-12 rounded-full border-2 border-ink font-bold"
            >
              Start free
            </Link>
          </Reveal>

          <Reveal delay={100} className="relative bg-ink text-white rounded-[32px] p-7 sm:p-10 flex flex-col shadow-[8px_8px_0_var(--gold)]">
            <span className="absolute -top-3.5 right-6 bg-gold text-ink text-xs font-extrabold px-3 py-1.5 rounded-full rotate-[4deg]">
              Recommended
            </span>
            <h2 className="font-brand font-extrabold text-3xl">Pro</h2>
            <p className="mt-1 text-white/70">For when you&apos;re applying seriously.</p>
            <div className="mt-6 mb-8">
              <span className="font-brand font-extrabold text-5xl">{regionalPrice.display}</span>
              <span className="text-white/70 font-bold"> / month</span>
              {regionalPrice.tier !== "full" && (
                <p className="text-sm text-white/60 mt-2">Priced for your country. Same features everywhere.</p>
              )}
            </div>
            <ul className="space-y-3.5 mb-10 flex-1">
              <FeatureLine included dark>Everything in Free</FeatureLine>
              <FeatureLine included dark>Unlimited resumes</FeatureLine>
              <FeatureLine included dark>All 10 templates</FeatureLine>
              <FeatureLine included dark>Unlimited PDF downloads</FeatureLine>
              <FeatureLine included dark>Unlimited AI bullet &amp; summary writing</FeatureLine>
              <FeatureLine included dark>AI Resume Agent</FeatureLine>
              <FeatureLine included dark>AI cover &amp; resignation letters</FeatureLine>
              <FeatureLine included dark>DOCX &amp; Google Drive export</FeatureLine>
            </ul>
            <UpgradeButton />
          </Reveal>
        </div>
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
