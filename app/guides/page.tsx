import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, CtaBand } from "@/components/marketing/MarketingPage";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Resume & Job Search Guides for India | Lettr",
  description:
    "Free, practical guides: resume format for freshers, how to make a resume for Naukri, ATS-friendly resumes and cover letter format, with examples.",
  alternates: { canonical: "/guides" },
  openGraph: {
    images: [OG_IMAGE],
    title: "Resume & Job Search Guides",
    description: "Practical, India-focused guides to resumes, ATS and cover letters.",
    url: "/guides",
  },
};

export default function GuidesPage() {
  return (
    <MarketingPage
      eyebrow="Guides"
      title="Resume and job search guides"
      intro={<p>Short, practical guides to getting your resume read and your interview booked, written for job seekers in India.</p>}
    >
      <section className={`${WRAP} pb-16`}>
        <ul className="grid sm:grid-cols-2 gap-5">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="group h-full flex flex-col bg-white border-2 border-rule hover:border-ink rounded-[24px] p-6 sm:p-7 transition-colors"
              >
                <span className="text-sm font-bold text-slate">{g.readMinutes} min read</span>
                <span className="mt-2 font-brand font-extrabold text-[22px] sm:text-[26px] leading-tight tracking-tight group-hover:text-brand-blue">
                  {g.title}
                </span>
                <span className="mt-3 text-slate leading-relaxed">{g.description}</span>
                <span className="mt-auto pt-5 font-bold text-brand-blue">Read the guide →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand title="Put the advice to work" text="Build a clean, ATS-friendly resume and see your score as you write. Free to start." />
    </MarketingPage>
  );
}
