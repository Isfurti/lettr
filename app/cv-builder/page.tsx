import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand, BTN_BLUE, BTN_OUTLINE } from "@/components/marketing/MarketingPage";
import { EXAMPLES } from "@/lib/examples";
import { FREE_AI_REWRITES } from "@/lib/free-plan";

// "CV" is what people search for in the UK, Ireland and most of Europe; the
// rest of the site says "resume", so this page is the CV-language entry point.
export const metadata: Metadata = {
  title: "Free CV Builder with ATS CV Checker (UK & Europe) | Lettr",
  description:
    "Make a professional CV in minutes: ATS-friendly CV templates, a live ATS score and AI help with your personal statement. A4 PDF download. Free to start.",
  alternates: { canonical: "/cv-builder" },
  openGraph: {
    images: [OG_IMAGE],
    title: "Free CV Builder with ATS CV Checker",
    description: "ATS-friendly CV templates, a live ATS score and AI help with your personal statement. Free to start.",
    url: "/cv-builder",
  },
};

const SECTIONS = [
  { t: "Contact details", b: "Name, phone, email, town or city and LinkedIn. In the UK and Ireland leave out your photo, date of birth and marital status." },
  { t: "Personal statement", b: "Three or four lines at the top: who you are, what you're good at and the role you want. Tailor it to each job." },
  { t: "Work experience", b: "Most recent first. Job title, employer, dates, then 3-5 bullet points that show results, ideally with numbers." },
  { t: "Education", b: "Degree, university and dates. UK employers often look for your classification (2:1, First); elsewhere add your grade if it's strong." },
  { t: "Skills", b: "The tools and skills the job advert asks for: Excel, SQL, CRM systems, languages with their level (e.g. German B2)." },
  { t: "Extras that help", b: "Certifications, volunteering or projects that support the role. References are \"available on request\", or simply left off." },
];

const CV_VS_RESUME = [
  ["Word used", "CV in the UK, Ireland and most of Europe", "Resume in the USA and Canada"],
  ["Length", "Usually 2 pages (1 for graduates)", "Usually 1 page"],
  ["Paper size", "A4", "US Letter"],
  ["Photo", "No in the UK and Ireland; still common in Germany", "No"],
];

const FAQ = [
  {
    q: "Is Lettr's CV builder free?",
    a: `Yes. The free plan gives you one CV, the Classic and Modern templates, the live ATS score, a PDF download and a free try of every AI tool (${FREE_AI_REWRITES} rewrites, a cover letter, an ATS review and a practice interview). No card needed.`,
  },
  { q: "What's the difference between a CV and a resume?", a: "Mostly the name and the length. The UK, Ireland and most of Europe say CV and accept two pages; the USA and Canada say resume and expect one. Lettr builds both: pick A4 or US Letter and the length that suits where you're applying." },
  { q: "Will my CV get through applicant tracking systems (ATS)?", a: "Lettr's templates use real, single-column text that ATS software reads correctly, and the live ATS score shows what job sites will read and what to fix. You can also upload an existing CV to the free ATS CV checker." },
  { q: "Should I put a photo on my CV?", a: "In the UK and Ireland, no: employers don't expect it. In Germany, Austria and Switzerland a professional photo is still common. Lettr lets you add one or leave it off." },
  { q: "Do I need a Europass CV?", a: "Only if the employer or programme asks for one, which is mostly EU institutions and some study or exchange schemes. Most companies across Europe are happy with a clear, standard CV." },
  { q: "Can I download my CV in Word?", a: "PDF is free. Word download comes with Pro, for employers or agencies that ask for a .docx file." },
];

const CV_EXAMPLES = ["data-analyst-uk", "registered-nurse-uk-nhs", "mechanical-engineer-germany", "software-engineer-usa"];

export default function CvBuilderPage() {
  const examples = CV_EXAMPLES.map((slug) => EXAMPLES.find((e) => e.slug === slug)).filter((e): e is (typeof EXAMPLES)[number] => Boolean(e));

  return (
    <MarketingPage
      eyebrow="For the UK and Europe"
      title="Free CV builder"
      intro={
        <p>
          Make a professional CV that both recruiters and ATS software can read. Pick an ATS-friendly CV template, write with AI help, see your score
          as you type, then download an A4 PDF. Free to start, no card needed.
        </p>
      }
      jsonLd={faqJsonLd(FAQ)}
    >
      <section className={`${WRAP} pb-14 flex flex-wrap gap-3`}>
        <Link href="/builder/new" className={BTN_BLUE}>
          Build my CV
        </Link>
        <Link href="/resume-checker" className={BTN_OUTLINE}>
          Check my CV for free
        </Link>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>The CV format UK and European employers expect</h2>
          <p className="mt-3 text-slate text-lg max-w-2xl">One column, clear headings, in this order. Lettr&apos;s CV maker sets it up for you.</p>
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

      <section className={`${WRAP} py-14`}>
        <h2 className={H2}>CV or resume?</h2>
        <p className="mt-3 text-slate text-lg max-w-2xl">Same idea, different habits. Lettr does both, so you can apply anywhere.</p>
        <div className="mt-6 bg-white border-2 border-rule rounded-[24px] overflow-x-auto">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className="py-3 px-5 font-extrabold"></th>
                <th className="py-3 px-5 font-extrabold">CV</th>
                <th className="py-3 px-5 font-extrabold">Resume</th>
              </tr>
            </thead>
            <tbody>
              {CV_VS_RESUME.map(([k, cv, res]) => (
                <tr key={k} className="border-b border-rule/60 last:border-0 align-top">
                  <td className="py-3 px-5 font-bold">{k}</td>
                  <td className="py-3 px-5 text-slate">{cv}</td>
                  <td className="py-3 px-5 text-slate">{res}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {examples.length > 0 && (
        <section className="bg-white border-y border-rule">
          <div className={`${WRAP} py-14`}>
            <h2 className={H2}>CV examples</h2>
            <p className="mt-3 text-slate text-lg max-w-2xl">Real-looking CVs for jobs in the UK, Europe and the USA. Use any of them as your starting point.</p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {examples.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/examples/${e.slug}`}
                    className="flex items-center justify-between gap-3 min-h-14 px-5 rounded-2xl bg-cream border-2 border-rule hover:border-ink font-bold transition-colors"
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
              See all examples →
            </Link>
          </div>
        </section>
      )}

      <section className={`${WRAP} py-14`}>
        <div className="bg-cream rounded-[24px] border-2 border-rule p-6 sm:p-8 max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-wide text-brand-blue">How Lettr helps</p>
          <ul className="mt-4 space-y-3 leading-relaxed">
            <li>
              <span className="font-bold">ATS CV checker:</span>{" "}upload your CV and see exactly what job sites read, with a score and fixes.
            </li>
            <li>
              <span className="font-bold">AI personal statement and bullets:</span>{" "}turn rough notes into clear, specific lines. It never makes up numbers.
            </li>
            <li>
              <span className="font-bold">Match to the job advert:</span>{" "}paste a job post to see which keywords your CV is missing.
            </li>
            <li>
              <span className="font-bold">
                <Link href="/tools/cover-letter-writer" className="underline">
                  Cover letters
                </Link>
                :
              </span>{" "}
              a short, tailored letter from your CV and the job advert.
            </li>
            <li>
              <span className="font-bold">A4 or US Letter:</span>{" "}the right paper size for wherever you apply.
            </li>
          </ul>
          <Link href="/templates" className="mt-5 inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline">
            Browse CV templates →
          </Link>
        </div>
      </section>

      <section className={`${WRAP} pb-14`}>
        <h2 className={`${H2} mb-6`}>Questions</h2>
        <Faq items={FAQ} />
      </section>

      <CtaBand title="Make a CV that gets read" text="ATS-friendly CV templates, a live score and AI help. Free to start." />
    </MarketingPage>
  );
}
