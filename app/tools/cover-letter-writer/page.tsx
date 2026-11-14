import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { LETTER_TEMPLATES } from "@/lib/letter-templates";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand, BTN_BLUE, BTN_OUTLINE } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Free AI Cover Letter Writer | Lettr",
  description:
    "Write a tailored cover letter from your resume and the job post in under a minute. Your first one is free, no card needed. Includes a cover letter format guide and example.",
  alternates: { canonical: "/tools/cover-letter-writer" },
  openGraph: {
    images: [OG_IMAGE], title: "Free AI Cover Letter Writer", description: "Your resume + the job post = a tailored cover letter. Your first one is free.", url: "/tools/cover-letter-writer" },
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
  { q: "Is it free?", a: "A free Lettr account writes your first cover letter free. Pro includes unlimited cover letters (fair-use limits apply) and uses our best writing model." },
  { q: "Will it make things up?", a: "No. It only uses achievements that are in your resume. Read it through and add a personal line before you send it." },
];

/** Signed-in people go straight to the Cover letter tab of their latest resume. */
const WRITER_HREF = "/builder/new?tab=cover-letter";

export default async function CoverLetterWriterPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const user = userId ? await getUserById(userId) : undefined;
  const signedIn = Boolean(user);
  const pro = user?.plan === "pro";

  return (
    <MarketingPage
      eyebrow="Free tool"
      title="Cover letter writer"
      intro={
        <p>
          Paste the job post. Lettr writes a short, specific cover letter from your own resume, ready to edit and send.
          {!pro && " Your first one is free."}
        </p>
      }
      jsonLd={faqJsonLd(FAQ)}
    >
      <section className={`${WRAP} pb-14 flex flex-wrap gap-3`}>
        {signedIn ? (
          <Link href={WRITER_HREF} className={BTN_BLUE}>
            Open cover letter writer
          </Link>
        ) : (
          <>
            <Link href="/signup" className={BTN_BLUE}>
              Write my cover letter, free
            </Link>
            <Link href="/builder/new" className={BTN_OUTLINE}>
              Build my resume first
            </Link>
          </>
        )}
      </section>

      <section className={`${WRAP} pb-14`}>
        <h2 className={H2}>10 letter designs</h2>
        <p className="mt-2 text-slate max-w-2xl">
          Every design uses your name, contact details and accent colour.{" "}
          {pro ? "All 10 come with your Pro plan." : "Classic and Modern are free; the other 8 come with Pro."}
        </p>
        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {LETTER_TEMPLATES.map((t) => (
            <li key={t.id} className="relative">
              <Image
                src={`/letter-designs/${t.id}.jpg`}
                alt={`${t.name} cover letter design`}
                width={447}
                height={632}
                className="w-full h-auto rounded-lg border border-rule bg-white shadow-sm"
              />
              {!pro && (
                <span
                  className={`absolute top-2 right-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                    t.free ? "bg-gold text-ink" : "bg-ink text-gold"
                  }`}
                >
                  {t.free ? "FREE" : "PRO"}
                </span>
              )}
              <p className="font-bold mt-2">{t.name}</p>
              <p className="text-sm text-slate">{t.blurb}</p>
            </li>
          ))}
        </ul>
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

      <CtaBand
        title="One resume, a tailored letter for every job"
        text="Lettr writes each cover letter from your resume and the job post, then checks your ATS score for that job."
        href={signedIn ? WRITER_HREF : "/signup"}
        label={signedIn ? "Open cover letter writer" : "Create a free account"}
      />
    </MarketingPage>
  );
}
