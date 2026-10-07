import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, CtaBand } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Lettr vs Rezi: Resume Builder Comparison (2026) | Lettr",
  description:
    "An honest comparison of Lettr and Rezi: prices, free plans, ATS checks, cover letters, interview practice and what each does best.",
  alternates: { canonical: "/compare/rezi" },
};

type Cell = string | boolean;
const ROWS: { label: string; lettr: Cell; rezi: Cell }[] = [
  { label: "Pro price", lettr: "₹699/month in India (incl. GST), $24 in the US", rezi: "$29/month" },
  { label: "Longer plans", lettr: "3-month pass and yearly", rezi: "Lifetime ($149 once)" },
  { label: "Prices set for your country", lettr: true, rezi: false },
  { label: "GST invoices (India)", lettr: true, rezi: false },
  { label: "Free plan: resumes / PDF downloads", lettr: "1 / unlimited (small Lettr line after the first)", rezi: "1 / 3" },
  { label: "Free plan: cover letters", lettr: "1 free", rezi: "Unlimited" },
  { label: "ATS score with fixes", lettr: "Full, free on every plan", rezi: "Limited on free, full on Pro" },
  { label: "Keyword match for a job post", lettr: "Score free, all missing keywords on Pro", rezi: "Limited on free, full on Pro" },
  { label: "AI interview practice", lettr: "1 free, 40 a month on Pro", rezi: "1 free, unlimited on Pro" },
  { label: "Job application tracker", lettr: true, rezi: false },
  { label: "Free resume checker without an account", lettr: true, rezi: false },
  { label: "Indian example resumes (campus, CA, ITI, BPO...)", lettr: true, rezi: false },
  { label: "Share on WhatsApp", lettr: true, rezi: false },
  { label: "Expert human resume review", lettr: false, rezi: "1 a month on Pro" },
  { label: "Money-back guarantee", lettr: "Not yet", rezi: "30 days" },
];

function Value({ v }: { v: Cell }) {
  if (v === true) return <span className="text-[#1F7A45] font-extrabold" aria-label="Yes">✓</span>;
  if (v === false) return <span className="text-slate" aria-label="No">—</span>;
  return <span>{v}</span>;
}

export default function CompareReziPage() {
  return (
    <MarketingPage
      eyebrow="Compare"
      title="Lettr vs Rezi"
      intro={
        <p>
          Both are good AI resume builders. Here&apos;s an honest side-by-side so you can pick the right one, including where Rezi is ahead.
        </p>
      }
    >
      <section className={`${WRAP} pb-6`}>
        <div className="bg-white border-2 border-ink rounded-[28px] overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="p-4 font-extrabold w-[40%]">Feature</th>
                <th className="p-4 font-extrabold bg-gold-soft">Lettr</th>
                <th className="p-4 font-extrabold">Rezi</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-rule last:border-0">
                  <td className="p-4 font-bold">{r.label}</td>
                  <td className="p-4 bg-gold-soft/50">
                    <Value v={r.lettr} />
                  </td>
                  <td className="p-4">
                    <Value v={r.rezi} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate">
          Rezi details checked on 6 October 2026 from Rezi&apos;s public pricing page. Prices and features change, so check their site before you
          decide. Rezi is a trademark of its owner; Lettr isn&apos;t connected to it.
        </p>
      </section>

      <section className={`${WRAP} py-12 grid md:grid-cols-2 gap-5`}>
        <div className="bg-white rounded-[24px] border-2 border-rule p-6">
          <h2 className="font-brand font-extrabold text-2xl">Choose Lettr if…</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5 text-slate">
            <li>You&apos;re job hunting in India or another country where US-dollar pricing hurts.</li>
            <li>You want the full ATS score and keyword match without paying.</li>
            <li>You want to track applications and practise interviews in the same place.</li>
            <li>You need a GST invoice.</li>
          </ul>
        </div>
        <div className="bg-white rounded-[24px] border-2 border-rule p-6">
          <h2 className="font-brand font-extrabold text-2xl">Choose Rezi if…</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5 text-slate">
            <li>You want unlimited cover letters on a free plan.</li>
            <li>You&apos;d like a monthly review from a human expert.</li>
            <li>You prefer paying once for lifetime access.</li>
          </ul>
        </div>
      </section>

      <section className={`${WRAP} pb-14`}>
        <h2 className={H2}>Try Lettr free</h2>
        <p className="mt-3 text-lg text-slate max-w-2xl">
          Build a resume and check its ATS score without signing up. Or upload your current resume to the{" "}
          <Link href="/resume-checker" className="font-bold text-brand-blue underline">
            free checker
          </Link>
          .
        </p>
      </section>

      <CtaBand title="See your ATS score in two minutes" text="Start from a blank page, an example, or the resume you already have." />
    </MarketingPage>
  );
}
