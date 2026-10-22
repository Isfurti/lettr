import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, CtaBand } from "@/components/marketing/MarketingPage";
import { COMPANY, SELLER } from "@/lib/company";

export const metadata: Metadata = {
  title: "About Lettr | AI Resume Builder from India",
  description: "Lettr helps job seekers build honest, job-ready resumes, practise interviews and track applications. Made in India.",
  alternates: { canonical: "/about" },
};

const PROMISES = [
  { t: "We never invent your experience", b: "The AI rewrites what you tell it. It doesn't make up jobs, numbers or skills, and it marks where you need to add a real detail." },
  { t: "Your data stays yours", b: "We don't sell your data or show ads. Resumes are private to your account, and you can delete everything yourself, any time." },
  { t: "Try before you sign up", b: "Build a resume, check your ATS score and get a free AI rewrite without an account." },
  { t: "Priced for where you live", b: "Prices are set for your country and include GST in India, with proper GST invoices." },
  { t: "No fake numbers", b: "You won't see made-up user counts, fake reviews or borrowed company logos on Lettr. Reviews come from real users who agreed to be shown." },
];

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About"
      title="Helping people get hired, honestly"
      intro={
        <p>
          Lettr is a resume builder for real job hunts: a phone in one hand, a job post in the other, and not much time. It helps you write a
          resume that gets through hiring software and impresses the person who reads it next.
        </p>
      }
    >
      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>What Lettr does</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ["Build", "16 templates, a guided form, one-tap AI rewrites, PDF and Word downloads, and a Design panel for every detail."],
              ["Check", "An ATS score analyst that shows how job-site software reads your resume and what the job post wants."],
              ["Apply", "Cover letters from your own resume, a tracker for every application, and WhatsApp sharing."],
              ["Prepare", "Interview practice with questions for your role and honest feedback on each answer."],
              ["Learn", "39 example resumes for Indian and global roles, from campus placements to senior leaders."],
              ["Grow", "Fair prices for each country, and a free plan that's genuinely useful."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-[24px] border-2 border-rule p-5">
                <p className="font-brand font-extrabold text-xl">{t}</p>
                <p className="text-slate mt-1">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${WRAP} py-14`}>
        <h2 className={H2}>Our promises</h2>
        <ul className="mt-6 space-y-4 max-w-3xl">
          {PROMISES.map((p) => (
            <li key={p.t} className="flex gap-4">
              <span aria-hidden="true" className="w-8 h-8 shrink-0 rounded-full bg-[#DCF3E5] text-[#1F7A45] font-extrabold flex items-center justify-center">
                ✓
              </span>
              <div>
                <p className="font-bold text-lg">{p.t}</p>
                <p className="text-slate">{p.b}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${WRAP} pb-14`}>
        <div className="max-w-3xl bg-gold-soft rounded-[28px] p-7 sm:p-9">
          <h2 className="font-brand font-extrabold text-2xl sm:text-3xl tracking-tight">A note from the founder</h2>
          <div className="mt-4 space-y-3 text-lg leading-relaxed">
            <p>
              Job hunting is hard enough without resume tools that hide the price, make up numbers for you, or ask for your
              card before you&apos;ve seen what you get.
            </p>
            <p>
              So Lettr works the other way. You see your score and your fixes for free. The AI only rewrites what you tell it.
              And the price is set for the country you live in.
            </p>
            <p>
              If something doesn&apos;t work for you, or there&apos;s a feature you need,{" "}
              {COMPANY.contactEmail ? (
                <>
                  write to me at{" "}
                  <a href={`mailto:${COMPANY.contactEmail}`} className="font-bold text-brand-blue underline">
                    {COMPANY.contactEmail}
                  </a>
                </>
              ) : (
                <>
                  write to me from our <Link href="/support" className="font-bold text-brand-blue underline">help page</Link>
                </>
              )}
              . I read every message.
            </p>
          </div>
          <p className="mt-5 font-bold">
            {COMPANY.founder.name}
            <span className="block font-normal text-slate">
              {COMPANY.founder.title}, Lettr
            </span>
          </p>
        </div>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>Who we are</h2>
          <p className="mt-4 text-lg text-slate max-w-3xl leading-relaxed">
            Lettr is made in India
            {SELLER ? (
              <>
                {" "}by <strong className="text-ink">{SELLER.legalName}</strong>
              </>
            ) : null}
            . Questions, ideas or problems?{" "}
            {COMPANY.contactEmail ? (
              <>
                Email{" "}
                <a href={`mailto:${COMPANY.contactEmail}`} className="font-bold text-brand-blue underline">
                  {COMPANY.contactEmail}
                </a>{" "}
                or visit
              </>
            ) : (
              "Write to us from"
            )}{" "}
            our <Link href="/support" className="font-bold text-brand-blue underline">help page</Link>. See what we&apos;ve shipped lately on{" "}
            <Link href="/whats-new" className="font-bold text-brand-blue underline">What&apos;s new</Link>.
          </p>
        </div>
      </section>

      <CtaBand title="Start your resume" text="Free to start. No card, no catch." />
    </MarketingPage>
  );
}
