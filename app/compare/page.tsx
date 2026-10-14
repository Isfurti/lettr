import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, CtaBand } from "@/components/marketing/MarketingPage";
import { REGION_PRICES } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Lettr vs Other Resume Builders: Rezi, Zety, Resume.io, Teal, Kickresume (2026) | Lettr",
  description:
    "An honest comparison of Lettr with Rezi, Zety, Resume.io, Teal and Kickresume: monthly prices, free PDF downloads, trial auto-renewals and what each does best.",
  alternates: { canonical: "/compare" },
};

const IN = REGION_PRICES.IN;
const US = REGION_PRICES.US;

const APPS = ["Lettr", "Rezi", "Zety", "Resume.io", "Teal", "Kickresume"] as const;
type App = (typeof APPS)[number];
type Cell = string | boolean;

/**
 * Competitor details from each company's pricing page or a pricing tracker,
 * checked 14 October 2026. Only facts we could check are listed; where we
 * couldn't, the cell says so rather than guessing.
 */
const ROWS: { label: string; values: Record<App, Cell> }[] = [
  {
    label: "Pro price, monthly (US)",
    values: {
      Lettr: `$${US.monthly} (${IN.format(IN.monthly)} in India, incl. GST)`,
      Rezi: "$29",
      Zety: "$25.95 every 4 weeks",
      "Resume.io": "$24.95 every 4 weeks",
      Teal: "$29 (or $13 a week)",
      Kickresume: "$19",
    },
  },
  {
    label: "Longer plans",
    values: {
      Lettr: `3 months $${US.quarter}, yearly $${US.yearly}`,
      Rezi: "Lifetime $149, paid once",
      Zety: "Yearly $71.40",
      "Resume.io": "Not checked",
      Teal: "3 months $79",
      Kickresume: "3-month and yearly plans",
    },
  },
  {
    label: "Cheap trial that renews at full price",
    values: {
      Lettr: false,
      Rezi: false,
      Zety: "$1.95 for 14 days, then $25.95 every 4 weeks",
      "Resume.io": "$2.95 for 7 days, then $24.95 every 4 weeks",
      Teal: false,
      Kickresume: false,
    },
  },
  {
    label: "Free plan: download a PDF",
    values: {
      Lettr: "Yes (small Lettr line after the first)",
      Rezi: "3 PDFs",
      Zety: "No, text file only",
      "Resume.io": "No, text file only",
      Teal: "1 resume",
      Kickresume: "Yes, 4 basic templates",
    },
  },
  {
    label: "Money-back guarantee",
    values: {
      Lettr: "No (accidental charges refunded)",
      Rezi: "30 days",
      Zety: "Not stated",
      "Resume.io": "7 days",
      Teal: "Not checked",
      Kickresume: "Not checked",
    },
  },
];

function Value({ v }: { v: Cell }) {
  if (v === true) return <span className="text-[#1F7A45] font-extrabold" aria-label="Yes">✓</span>;
  if (v === false) return <span className="text-slate" aria-label="No">No</span>;
  return <span className={v.startsWith("Not checked") ? "text-slate/70" : undefined}>{v}</span>;
}

const LETTR_EXTRAS = [
  "Free ATS score with fixes, and a free resume checker that needs no account",
  "Interview practice with AI feedback, and a job application tracker",
  "39 example resumes, including campus placements, CA, ITI trades and BPO roles",
  "Prices set for your country, with GST invoices in India",
  "Share your resume straight to WhatsApp",
  "The AI only rewrites what you tell it. It never invents jobs, numbers or skills",
];

const OTHERS_BETTER: { app: string; why: string }[] = [
  { app: "Rezi", why: "You'd rather pay once for lifetime access, or want a 30-day money-back guarantee." },
  { app: "Zety", why: "You want the cheapest yearly plan and many pre-written phrases." },
  { app: "Resume.io", why: "You want a 7-day money-back guarantee and polished designer templates." },
  { app: "Teal", why: "You track a lot of jobs and want a browser extension that saves job posts." },
  { app: "Kickresume", why: "You want a low monthly price and lots of design-led templates." },
];

export default function CompareOthersPage() {
  return (
    <MarketingPage
      eyebrow="Compare"
      title="Lettr vs other resume builders"
      intro={
        <p>
          How Lettr compares with Rezi, Zety, Resume.io, Teal and Kickresume on price, free plans and the small print, including where the others
          are ahead.
        </p>
      }
    >
      <section className={`${WRAP} pb-6`}>
        {/* Phones: one card per feature, each app on its own line, so nothing scrolls sideways. */}
        <ul className="md:hidden bg-white border-2 border-ink rounded-[28px] divide-y divide-rule overflow-hidden">
          {ROWS.map((r) => (
            <li key={r.label} className="p-4">
              <p className="font-bold">{r.label}</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                {APPS.map((a) => (
                  <div key={a} className={`flex gap-3 rounded-xl px-3 py-1.5 ${a === "Lettr" ? "bg-gold-soft/70" : ""}`}>
                    <dt className="w-24 shrink-0 font-extrabold">{a}</dt>
                    <dd>
                      <Value v={r.values[a]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <div className="hidden md:block bg-white border-2 border-ink rounded-[28px] overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[15px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="p-4 font-extrabold w-[18%]">Feature</th>
                {APPS.map((a) => (
                  <th key={a} className={`p-4 font-extrabold ${a === "Lettr" ? "bg-gold-soft" : ""}`}>
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-rule last:border-0 align-top">
                  <td className="p-4 font-bold">{r.label}</td>
                  {APPS.map((a) => (
                    <td key={a} className={`p-4 ${a === "Lettr" ? "bg-gold-soft/50" : ""}`}>
                      <Value v={r.values[a]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate">
          Other apps&apos; details checked on 14 October 2026 from their pricing pages or public pricing trackers, in US dollars. &quot;Not
          checked&quot; means we couldn&apos;t confirm it. Prices and features change, so check each site before you decide. Rezi, Zety, Resume.io,
          Teal and Kickresume are trademarks of their owners; Lettr isn&apos;t connected to any of them.
        </p>
      </section>

      <section className={`${WRAP} py-12 grid md:grid-cols-2 gap-5`}>
        <div className="bg-white rounded-[24px] border-2 border-rule p-6">
          <h2 className="font-brand font-extrabold text-2xl">Choose Lettr if you want…</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5 text-slate">
            {LETTR_EXTRAS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-[24px] border-2 border-rule p-6">
          <h2 className="font-brand font-extrabold text-2xl">Another app may suit you better if…</h2>
          <ul className="mt-3 space-y-2 text-slate">
            {OTHERS_BETTER.map((o) => (
              <li key={o.app}>
                <strong className="text-ink">{o.app}:</strong> {o.why}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${WRAP} pb-14`}>
        <h2 className={H2}>Watch the trial small print</h2>
        <p className="mt-3 text-lg text-slate max-w-2xl">
          Some resume builders charge a small amount for a short trial and then renew automatically at the full price every four weeks. Lettr
          has no trial that turns into a bigger charge: the free plan stays free, and Pro costs what the pricing page says.{" "}
          <Link href="/pricing" className="font-bold text-brand-blue underline">
            See Lettr&apos;s prices
          </Link>
          .
        </p>
      </section>

      <CtaBand title="See your ATS score in two minutes" text="Start from a blank page, an example, or the resume you already have." />
    </MarketingPage>
  );
}
