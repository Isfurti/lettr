import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { ResumeChecker } from "@/components/checker/ResumeChecker";

export const metadata: Metadata = {
  title: "Free ATS Resume Checker: See What Job Sites Read | Lettr",
  description:
    "Upload your resume or LinkedIn PDF and see exactly what hiring software reads from it, plus a free score and fixes. No account needed.",
  alternates: { canonical: "/resume-checker" },
  openGraph: {
    title: "Free Resume Checker | Lettr",
    description: "See what job sites read from your resume, get a free score and the fixes that matter. No signup.",
    url: "/resume-checker",
  },
};

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. You can check your resume without an account. We limit how many checks one person can run in a day to keep it free for everyone.",
  },
  {
    q: "Do you keep my resume?",
    a: "No. Your file is read once to make the report and then thrown away. It's only saved if you choose to open it in the builder.",
  },
  {
    q: "Why does the text look different from my resume?",
    a: "That's the point: it's the plain text hiring software pulls out of your file. Fancy layouts, tables and icons often come out jumbled or missing.",
  },
  {
    q: "Can I check my LinkedIn profile?",
    a: "Yes. Save your LinkedIn profile as a PDF (More → Save to PDF on your profile) and upload it. You can then turn it into a proper resume in the builder.",
  },
];

export default async function ResumeCheckerPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <main className="flex-1 max-w-[1180px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-10 sm:py-14">
        <div className="max-w-2xl mb-10 rise">
          <p className="inline-flex items-center gap-2 bg-gold-soft text-sm font-bold px-3.5 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-gold-deep" aria-hidden="true" />
            Free · No account needed
          </p>
          <h1 className="font-brand font-extrabold text-[40px] sm:text-[58px] leading-[1.02] tracking-tight">
            See what job sites see.
          </h1>
          <p className="mt-5 text-lg text-slate leading-relaxed">
            Upload your resume or LinkedIn PDF. Lettr shows you the text hiring software actually reads, checks it for
            common problems, and gives you a score with the fixes that matter.
          </p>
        </div>

        <ResumeChecker initialMode={from === "linkedin" ? "linkedin" : "file"} />

        <section className="mt-16 sm:mt-20 grid lg:grid-cols-[1fr_1.6fr] gap-10">
          <div>
            <h2 className="font-brand font-extrabold text-[32px] sm:text-[40px] leading-[1.05] tracking-tight">Good to know</h2>
            <p className="mt-3 text-slate">
              Want to build from scratch instead?{" "}
              <Link href="/builder/new" className="font-bold text-brand-blue hover:underline">
                Open the builder
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-rule open:border-ink transition-colors">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 min-h-14 px-5 py-4 font-bold text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center text-xl font-extrabold transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-slate leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
