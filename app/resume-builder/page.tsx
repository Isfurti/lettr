import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, H2, CtaBand, BTN_BLUE } from "@/components/marketing/MarketingPage";
import { COUNTRIES, docWord } from "@/lib/countries";

export const metadata: Metadata = {
  title: "Resume and CV Builder by Country | Lettr",
  description: "Pick where you're applying and see what employers expect: length, paper size, photo and spelling. Then build an ATS-friendly resume or CV.",
  alternates: { canonical: "/resume-builder" },
  openGraph: { images: [OG_IMAGE], title: "Resume and CV Builder by Country", url: "/resume-builder" },
};

export default function ResumeBuilderHub() {
  return (
    <MarketingPage
      eyebrow="By country"
      title="Resume and CV builder by country"
      intro={<p>Employers in different countries expect different things. Pick yours to see the local rules, then build the document in Lettr.</p>}
    >
      <section className={`${WRAP} pb-14`}>
        <h2 className={`${H2} mb-6`}>Choose your country</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COUNTRIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/resume-builder/${c.slug}`} className="flex items-center justify-between gap-3 min-h-14 px-5 rounded-2xl bg-white border-2 border-rule hover:border-ink font-bold transition-colors">
                <span>
                  {c.name.replace(/^the /, "")} <span className="text-slate font-semibold">· {docWord(c) === "CV" ? "CV" : "Resume"}</span>
                </span>
                <span aria-hidden="true" className="text-brand-blue">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link href="/builder/new" className={BTN_BLUE}>
            Start building
          </Link>
        </div>
      </section>
      <CtaBand title="Make a document that gets read" text="Pick your market, build it, see your ATS score." label="Start building" />
    </MarketingPage>
  );
}
