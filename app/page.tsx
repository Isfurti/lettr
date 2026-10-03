import type { Metadata } from "next";
import Link from "next/link";
import { HeroScoreDemo } from "@/components/HeroScoreDemo";
import { Reveal } from "@/components/Reveal";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { getFeaturedReviews } from "@/lib/db";

// Revalidate hourly rather than fetching featured reviews on every single
// page load - this is the highest-traffic page, no reason to hit the
// database per-visitor for content that changes rarely.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Lettr — AI Resume Builder with ATS Score & Cover Letters",
  description:
    "Build an ATS-optimized resume with AI. Get an instant match score against any job description, AI-rewritten bullet points, and a tailored cover letter — free to start.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lettr — AI Resume Builder with ATS Score & Cover Letters",
    description: "Build an ATS-optimized resume with AI. Instant match scoring, AI bullet rewriting, tailored cover letters.",
    url: "/",
    siteName: "Lettr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lettr — AI Resume Builder",
    description: "Build an ATS-optimized resume with AI — free to start.",
  },
};

export default async function Home() {
  const featuredReviews = await getFeaturedReviews(6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Lettr",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "AI-assisted resume builder with ATS scoring, AI bullet rewriting, and tailored cover letters.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available; Pro plan with regional pricing",
    },
  };

  return (
    <main className="flex-1 flex flex-col bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <p className="uppercase tracking-[0.18em] text-xs text-seal font-medium mb-4">
            AI-powered resume builder
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] font-semibold mb-6">
            Get more interviews with a resume that matches the job.
          </h1>
          <p className="text-ink-soft text-lg leading-relaxed mb-8 max-w-md">
            Paste a job description and Lettr shows the keywords you&apos;re missing, helps you rewrite your
            bullets with AI, and exports a clean, ATS-friendly PDF.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/builder/new"
              className="inline-block bg-seal text-white px-6 py-3 rounded-sm font-medium hover:opacity-90 transition-opacity"
            >
              Build your resume — free
            </Link>
            <Link href="/signup?continue=import" className="text-sm text-ink-soft hover:text-ink">
              Import my existing resume →
            </Link>
          </div>
          <p className="text-xs text-ink-soft mt-4">No sign-up needed to start · No credit card</p>
        </div>

        <HeroScoreDemo />
      </section>

      {/* How it works */}
      <section className="border-t border-rule">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-14 sm:py-16">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2 text-center">How it works</p>
          <h2 className="font-display font-semibold text-3xl mb-10 text-center">A job-ready resume in three steps.</h2>
          <ol className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "1",
                title: "Start or import",
                body: "Fill in a guided form, or upload your current resume (PDF or Word) and we fill it in for you.",
              },
              {
                n: "2",
                title: "Match it to the job",
                body: "Paste the job description. See your match score and the exact keywords to add.",
              },
              {
                n: "3",
                title: "Polish and download",
                body: "Rewrite weak bullets with AI, pick a template, and download a clean PDF.",
              },
            ].map((step) => (
              <li key={step.n} className="paper-sheet rounded-sm p-6">
                <span className="w-8 h-8 rounded-full bg-seal text-white text-sm font-semibold flex items-center justify-center mb-4">
                  {step.n}
                </span>
                <h3 className="font-display font-semibold text-lg mb-1.5">{step.title}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-rule bg-app-bg">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-16 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Data-driven intelligence</p>
          <h2 className="font-display font-semibold text-3xl mb-12 max-w-lg">
            Everything you need to get past the filters.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Job Match Score",
                body: "Paste any job description and see how many of its key terms your resume covers — and exactly which ones are missing.",
              },
              {
                title: "AI Bullet Rewriting",
                body: "Turn a rough accomplishment into three achievement-focused, ATS-friendly bullet options in seconds, grounded in what you actually did. 5 free rewrites.",
              },
              {
                title: "Resume Quality Score",
                body: "A live score that checks your contact details, summary, action verbs, numbers and skills — plus your next best fix. Pro adds the full section-by-section breakdown.",
              },
              {
                title: "Tailored Cover Letters",
                pro: true,
                body: "Paste any job description and Lettr drafts a cover letter pulled straight from your resume — matched to the role, not a generic template.",
              },
              {
                title: "AI Resume Agent",
                pro: true,
                body: "Chat with an assistant that directly edits your resume: \"tighten my summary,\" \"add a bullet about the migration project\" — it just does it.",
              },
              {
                title: "Resignation Letters",
                pro: true,
                body: "Leaving a role? Generate a professional resignation letter in the tone you want — warm, neutral, or brief — in one click.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60} className="paper-sheet rounded-sm p-6">
                <h3 className="font-display font-semibold text-lg mb-2 flex items-center gap-2">
                  {f.title}
                  {"pro" in f && f.pro && (
                    <span className="text-[10px] font-mono uppercase bg-ink text-white px-1.5 py-0.5 rounded-sm">Pro</span>
                  )}
                </h3>
                <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Real user reviews - only shown once at least one exists and has been
          admin-approved for public display. No placeholder content here on
          purpose - an empty section beats a fabricated one. */}
      {featuredReviews.length > 0 && (
        <section className="border-t border-rule">
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-16 sm:py-20">
            <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2 text-center">What people are saying</p>
            <h2 className="font-display font-semibold text-3xl mb-12 text-center">Real feedback, unedited.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredReviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 60} className="paper-sheet rounded-sm p-6 flex flex-col">
                  <p className="text-seal mb-3">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                  <p className="text-sm leading-relaxed flex-1 mb-4">&ldquo;{r.content}&rdquo;</p>
                  <p className="text-xs text-ink-soft font-medium">
                    {r.user_name ? r.user_name.split(" ")[0] : "A Lettr user"}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison */}
      <section className="bg-navy-deep text-white">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-20">
          <h2 className="font-display font-semibold text-3xl text-center mb-2">Why not just use Word or Google Docs?</h2>
          <p className="text-white/60 text-center mb-10">A document editor formats text. Lettr helps you win the job.</p>

          <div className="rounded-sm overflow-hidden border border-white/10 text-sm">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-white/5 px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-white/50">
              <span>Feature</span>
              <span className="text-center">Word / Docs</span>
              <span className="text-center">Lettr</span>
            </div>
            {[
              { feature: "ATS-friendly templates", docs: "Some" },
              { feature: "Keyword match against a job description", docs: "—" },
              { feature: "AI bullet rewriting", docs: "—" },
              { feature: "Resume quality score with tips", docs: "—" },
              { feature: "Cover & resignation letters from your resume", docs: "—" },
            ].map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1.6fr_1fr_1fr] px-4 sm:px-6 py-4 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
              >
                <span className="text-white/80 pr-2">{row.feature}</span>
                <span className="text-white/40 text-center">{row.docs}</span>
                <span className="text-seal text-center">✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature spotlight tiles */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-16 sm:py-20 grid md:grid-cols-2 gap-6">
        <div className="paper-sheet rounded-sm p-8">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Cover letter generator · Pro</p>
          <h3 className="font-display font-semibold text-xl mb-3">
            Written to bridge your resume and the job requirements.
          </h3>
          <p className="text-ink-soft text-sm mb-5">
            We analyze the job description and pull straight from your resume to write a letter that
            actually references your experience — not a fill-in-the-blank template.
          </p>
          <Link href="/pricing" className="text-sm text-seal font-medium hover:underline">
            See Pro →
          </Link>
        </div>
        <div className="bg-ink text-white rounded-sm p-8">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Resignation letters · Pro</p>
          <h3 className="font-display font-semibold text-xl mb-3">
            Leave on your terms, in the tone that fits.
          </h3>
          <p className="text-white/80 text-sm mb-5">
            Warm and appreciative, strictly neutral, or brief and to the point — generated from your
            role details in seconds.
          </p>
          <Link href="/pricing" className="text-sm text-seal-soft font-medium hover:underline">
            See Pro →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule bg-app-bg">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-16 sm:py-20 text-center">
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-8">The smarter way to get hired.</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/builder/new"
              className="bg-seal text-white px-6 py-3 rounded-sm font-medium hover:opacity-90 transition-opacity"
            >
              Build your resume
            </Link>
            <Link
              href="/templates"
              className="border border-rule px-6 py-3 rounded-sm font-medium hover:bg-paper-raised transition-colors"
            >
              Explore templates
            </Link>
          </div>
          <p className="text-xs text-ink-soft mt-4">Free to start. No credit card required.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
