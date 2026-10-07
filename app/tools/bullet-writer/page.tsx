import type { Metadata } from "next";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand } from "@/components/marketing/MarketingPage";
import { BulletWriterTool } from "@/components/marketing/BulletWriterTool";

export const metadata: Metadata = {
  title: "Free AI Resume Bullet Point Writer | Lettr",
  description:
    "Turn rough notes into strong, achievement-focused resume bullet points in seconds. Free, no account needed. Examples for sales, marketing, tech, finance and freshers.",
  alternates: { canonical: "/tools/bullet-writer" },
  openGraph: { title: "Free AI Resume Bullet Point Writer", description: "Rough notes in, strong resume bullets out. Free.", url: "/tools/bullet-writer" },
};

const EXAMPLES = [
  { role: "Sales", before: "handled big clients, sales went up", after: "Managed 18 enterprise accounts worth ₹4.2 Cr a year, growing renewals 22% through quarterly business reviews." },
  { role: "Marketing", before: "did social media for the brand", after: "Grew Instagram followers from 8,000 to 41,000 in 9 months with a weekly reels calendar and creator collaborations." },
  { role: "Software engineer", before: "worked on making the app faster", after: "Cut app load time from 4.1s to 1.6s by lazy-loading images and caching API calls, lifting day-7 retention 9%." },
  { role: "Operations", before: "managed warehouse team", after: "Led a 25-person warehouse team, reducing order dispatch time from 48 to 20 hours with a new picking layout." },
  { role: "Fresher / intern", before: "did an internship in finance", after: "Built a Power BI dashboard tracking 300+ vendor payments, saving the accounts team about 6 hours a week." },
  { role: "Customer support", before: "answered customer calls", after: "Resolved 60+ customer calls a day at a 94% satisfaction score, training 4 new joiners on the refund process." },
];

const FAQ = [
  { q: "What makes a good resume bullet point?", a: "Start with a strong action verb, say what you did, and finish with the result - ideally with a number (%, ₹, time saved, people, customers). Keep it to one or two lines." },
  { q: "Is the bullet writer really free?", a: "Yes. You get one free rewrite a day without an account, and a free Lettr account includes 3 more. Pro has unlimited rewrites." },
  { q: "Will the AI invent numbers?", a: "It's told not to. If a number would help but you didn't give one, it keeps the bullet qualitative. Always check every number is true before you use it." },
  { q: "How many bullet points should each job have?", a: "Two to six. Put your most impressive result first. Older or less relevant jobs can have fewer." },
];

export default function BulletWriterPage() {
  return (
    <MarketingPage
      eyebrow="Free tool"
      title="Resume bullet point writer"
      intro={<p>Type what you did in plain words. Get three strong, achievement-focused bullet points you can paste into your resume.</p>}
      jsonLd={[
        faqJsonLd(FAQ),
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Lettr resume bullet point writer", applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } },
      ]}
    >
      <section className={`${WRAP} pb-14`}>
        <BulletWriterTool />
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>The formula: verb + what you did + result</h2>
          <p className="mt-3 text-lg text-slate max-w-2xl">Recruiters skim. A bullet that starts with what you did and ends with a number tells your story in two seconds.</p>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {EXAMPLES.map((e) => (
              <div key={e.role} className="rounded-[24px] border-2 border-rule p-5">
                <p className="text-sm font-extrabold uppercase tracking-wide text-brand-blue">{e.role}</p>
                <p className="mt-2 text-slate line-through decoration-red-400">{e.before}</p>
                <p className="mt-2 font-bold">{e.after}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate">Examples only. Use your own real numbers.</p>
        </div>
      </section>

      <section className={`${WRAP} py-14`}>
        <h2 className={`${H2} mb-6`}>Questions</h2>
        <Faq items={FAQ} />
      </section>

      <CtaBand title="Write the whole resume this way" text="Lettr's builder rewrites any bullet in one tap, scores your resume and checks it against the job." />
    </MarketingPage>
  );
}
