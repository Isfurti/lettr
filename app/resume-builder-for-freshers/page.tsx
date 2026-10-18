import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand, BTN_BLUE, BTN_OUTLINE } from "@/components/marketing/MarketingPage";
import { EXAMPLES } from "@/lib/examples";
import { FREE_AI_REWRITES } from "@/lib/free-plan";

export const metadata: Metadata = {
  title: "Free Resume Builder for Freshers (ATS-Friendly) | Lettr",
  description:
    "Make your first resume in minutes: fresher resume format, ATS-friendly templates, a live ATS score and examples for campus placements, MBA, B.Com, engineering and more. Free to start.",
  alternates: { canonical: "/resume-builder-for-freshers" },
  openGraph: {
    title: "Free Resume Builder for Freshers",
    description: "Your first resume, done right: fresher format, ATS-friendly templates and a live score. Free to start.",
    url: "/resume-builder-for-freshers",
  },
};

const SECTIONS = [
  { t: "Contact details", b: "Name, phone, a professional email, city and LinkedIn. No photo, date of birth or father's name needed for most private-sector jobs." },
  { t: "Career objective (2-3 lines)", b: "The role you want and what you bring. \"B.Tech CSE fresher looking for a backend developer role; built 3 projects in Java and Spring Boot.\"" },
  { t: "Education", b: "Degree, college, year and CGPA or percentage. Add Class 12 and 10 only if they're strong or the company asks." },
  { t: "Projects and internships", b: "Your work experience as a fresher. One line on what you built, one on the result, with numbers where you have them." },
  { t: "Skills", b: "Tools and skills the job post names: Excel, Python, Tally, SQL, Canva. Keep soft skills for your bullets, not a list." },
  { t: "Achievements and certifications", b: "Hackathons, NSS, sports, NPTEL, Google or Microsoft certificates. Keep the ones that support the job." },
];

const MISTAKES = [
  "Using a two-column, graphics-heavy template that hiring software can't read",
  "A generic objective that could fit any job",
  "Listing duties (\"was responsible for\") instead of what you did and achieved",
  "Going over one page as a fresher",
  "Sending the same resume to every job instead of matching the keywords",
];

const FAQ = [
  {
    q: "Is Lettr free for freshers?",
    a: `Yes. The free plan gives you one resume, the Classic and Modern templates, the live ATS score, a PDF download and a free try of every AI tool (${FREE_AI_REWRITES} rewrites, a cover letter, an ATS review and a practice interview). No card needed.`,
  },
  { q: "What is the best resume format for freshers?", a: "A one-page, single-column format: contact details, a short objective, education, projects and internships, skills, then achievements. Clean text with clear headings is what both recruiters and applicant tracking systems read best." },
  { q: "What if I have no work experience?", a: "Use projects, internships, college societies, freelancing and certifications. Write each one like a job: what you did, the tools you used and the result. Our fresher examples show exactly how." },
  { q: "Should I add a photo or date of birth?", a: "For most private-sector jobs in India, no. They take space and aren't needed. Add them only if the company or a government form specifically asks." },
  { q: "Can I use this resume on Naukri, LinkedIn and campus portals?", a: "Yes. Download it as a PDF and upload it anywhere. Lettr's templates use real text, so job portals can read your details correctly." },
];

export default function ResumeBuilderForFreshersPage() {
  const fresherExamples = EXAMPLES.filter((e) => e.stage === "Fresher");

  return (
    <MarketingPage
      eyebrow="For freshers"
      title="Resume builder for freshers"
      intro={
        <p>
          Your first resume, done right. Pick a clean, ATS-friendly template, fill in your projects and education, and watch your score improve as you
          write. Free to start, no card needed.
        </p>
      }
      jsonLd={faqJsonLd(FAQ)}
    >
      <section className={`${WRAP} pb-14 flex flex-wrap gap-3`}>
        <Link href="/builder/new" className={BTN_BLUE}>
          Build my fresher resume
        </Link>
        <Link href="/resume-checker" className={BTN_OUTLINE}>
          Check my current resume
        </Link>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>The fresher resume format that works</h2>
          <p className="mt-3 text-slate text-lg max-w-2xl">One page, one column, in this order. Lettr&apos;s builder sets it up for you.</p>
          <ol className="mt-8 grid sm:grid-cols-2 gap-x-10 gap-y-6">
            {SECTIONS.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="w-9 h-9 shrink-0 rounded-full bg-ink text-gold font-brand font-extrabold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-bold">{s.t}</p>
                  <p className="text-slate">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {fresherExamples.length > 0 && (
        <section className={`${WRAP} py-14`}>
          <h2 className={H2}>Fresher resume examples</h2>
          <p className="mt-3 text-slate text-lg max-w-2xl">See what a good first resume looks like, then use any example as your starting point.</p>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fresherExamples.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/examples/${e.slug}`}
                  className="flex items-center justify-between gap-3 min-h-14 px-5 rounded-2xl bg-white border-2 border-rule hover:border-ink font-bold transition-colors"
                >
                  {e.title}
                  <span aria-hidden="true" className="text-brand-blue">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/examples" className="mt-5 inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline">
            See all resume examples →
          </Link>
        </section>
      )}

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14 grid lg:grid-cols-2 gap-10`}>
          <div>
            <h2 className={H2}>Five mistakes freshers make</h2>
            <ul className="mt-6 space-y-3">
              {MISTAKES.map((m) => (
                <li key={m} className="flex gap-3 items-start">
                  <span aria-hidden="true" className="shrink-0 mt-1 w-5 h-5 rounded-full bg-ink text-gold text-xs font-extrabold flex items-center justify-center">
                    ✕
                  </span>
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-cream rounded-[24px] border-2 border-rule p-6 sm:p-7">
            <p className="text-sm font-extrabold uppercase tracking-wide text-brand-blue">How Lettr helps</p>
            <ul className="mt-4 space-y-3 leading-relaxed">
              <li>
                <span className="font-bold">Live ATS score:</span>{" "}see what hiring software reads and what to fix, as you type.
              </li>
              <li>
                <span className="font-bold">Bullet writer:</span>{" "}turn &quot;did a project on…&quot; into a clear, specific line. It never makes up numbers.
              </li>
              <li>
                <span className="font-bold">Match to the job:</span>{" "}paste a job post to see which keywords you&apos;re missing.
              </li>
              <li>
                <span className="font-bold">Cover letters:</span>{" "}a short, tailored letter from your resume and the job post.
              </li>
            </ul>
            <Link href="/guides/resume-format-for-freshers" className="mt-5 inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline">
              Read the full fresher resume guide →
            </Link>
          </div>
        </div>
      </section>

      <section className={`${WRAP} py-14`}>
        <h2 className={`${H2} mb-6`}>Questions</h2>
        <Faq items={FAQ} />
      </section>

      <CtaBand title="Land your first interview" text="Build a clean, ATS-friendly fresher resume in minutes and see your score as you write." />
    </MarketingPage>
  );
}
