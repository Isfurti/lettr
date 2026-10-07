import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand, BTN_BLUE, BTN_OUTLINE } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Free AI Cover Letter Writer | Lettr",
  description:
    "Write a tailored cover letter from your resume and the job post in under a minute. 3 free a month, no card needed. Includes a cover letter format guide and example.",
  alternates: { canonical: "/tools/cover-letter-writer" },
  openGraph: { title: "Free AI Cover Letter Writer", description: "Your resume + the job post = a tailored cover letter. 3 free a month.", url: "/tools/cover-letter-writer" },
};

const STEPS = [
  { t: "Opening (2 lines)", b: "The role you're applying for, and one line on why you're a strong fit. Skip \"I am writing to apply\"." },
  { t: "Proof (1 short paragraph)", b: "Two achievements from your resume that match what the job asks for, with numbers." },
  { t: "Why them (2-3 lines)", b: "Something specific about the company: a product, a market, a value. Shows you're not mass-applying." },
  { t: "Close (1-2 lines)", b: "Say you'd welcome a conversation. Sign off with your name and phone number." },
];

const FAQ = [
  { q: "Do I still need a cover letter?", a: "Often, yes. Many recruiters skip them, but for competitive roles, career changes and small companies a short, specific letter can tip the balance. A generic one does nothing, which is why Lettr writes it from your own resume and the actual job post." },
  { q: "How long should a cover letter be?", a: "Under a page: three or four short paragraphs, about 200-320 words." },
  { q: "Is it free?", a: "A free Lettr account writes 3 cover letters a month. Pro has no monthly limit and uses our best writing model." },
  { q: "Will it make things up?", a: "No. It only uses achievements that are in your resume. Read it through and add a personal line before you send it." },
];

export default function CoverLetterWriterPage() {
  return (
    <MarketingPage
      eyebrow="Free tool"
      title="Cover letter writer"
      intro={<p>Paste the job post. Lettr writes a short, specific cover letter from your own resume, ready to edit and send. 3 free every month.</p>}
      jsonLd={faqJsonLd(FAQ)}
    >
      <section className={`${WRAP} pb-14 flex flex-wrap gap-3`}>
        <Link href="/signup" className={BTN_BLUE}>
          Write my cover letter, free
        </Link>
        <Link href="/builder/new" className={BTN_OUTLINE}>
          Build my resume first
        </Link>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14 grid lg:grid-cols-2 gap-10`}>
          <div>
            <h2 className={H2}>The four-part cover letter</h2>
            <ol className="mt-6 space-y-4">
              {STEPS.map((s, i) => (
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
          <figure className="bg-cream rounded-[24px] border-2 border-rule p-6 text-[15px] leading-relaxed">
            <figcaption className="text-sm font-extrabold uppercase tracking-wide text-brand-blue mb-3">Example (fictional)</figcaption>
            <p>Dear Hiring Team,</p>
            <p className="mt-3">
              I&apos;m applying for the Product Marketing Manager role at Northwind. I&apos;ve spent six years taking B2B software to market, and your
              focus on small businesses is exactly where I&apos;ve done my best work.
            </p>
            <p className="mt-3">
              At Brightline I led four launches that brought in 1,800 qualified leads, and rebuilt our email programme to lift open rates from
              18% to 27%. Both came from talking to customers first and writing in their words, which your job post asks for.
            </p>
            <p className="mt-3">I&apos;d love to bring that to Northwind&apos;s expansion into India and would welcome a conversation.</p>
            <p className="mt-3">
              Regards,
              <br />
              Aisha Mehra · +91 98000 00000
            </p>
          </figure>
        </div>
      </section>

      <section className={`${WRAP} py-14`}>
        <h2 className={`${H2} mb-6`}>Questions</h2>
        <Faq items={FAQ} />
      </section>

      <CtaBand title="One resume, a tailored letter for every job" text="Lettr writes each cover letter from your resume and the job post, then checks your ATS score for that job." href="/signup" label="Create a free account" />
    </MarketingPage>
  );
}
