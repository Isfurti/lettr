import Link from "next/link";
import { HeroScoreDemo } from "@/components/HeroScoreDemo";
import { Reveal } from "@/components/Reveal";
import { PublicNav } from "@/components/PublicNav";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col bg-paper">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-8 pt-16 pb-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="uppercase tracking-[0.18em] text-xs text-seal font-medium mb-4">
            AI-powered resume builder
          </p>
          <h1 className="font-display text-5xl leading-[1.08] font-semibold mb-6">
            Maximum algorithmic resume performance.
          </h1>
          <p className="text-ink-soft text-lg leading-relaxed mb-8 max-w-md">
            Stop guessing what recruiters want. Lettr scores your resume against any job description,
            identifies critical keyword gaps, and rewrites your bullets for maximum impact.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-block bg-seal text-white px-6 py-3 rounded-sm font-medium hover:opacity-90 transition-opacity"
            >
              Build your resume — free
            </Link>
            <Link href="/templates" className="text-sm text-ink-soft hover:text-ink">
              Browse templates →
            </Link>
          </div>
        </div>

        <HeroScoreDemo />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-rule bg-app-bg">
        <div className="max-w-6xl mx-auto w-full px-8 py-20">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Data-driven intelligence</p>
          <h2 className="font-display font-semibold text-3xl mb-12 max-w-lg">
            The tools recruiters&apos; filters can&apos;t out-think.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "ATS Match Score",
                body: "Get an instant score based on 25+ criteria — formatting, word count, and quantified impact — so you know exactly where your resume stands before you hit send.",
              },
              {
                title: "AI Bullet Rewriting",
                body: "Turn a rough accomplishment into three achievement-focused, ATS-friendly bullet options in seconds, grounded in what you actually did.",
              },
              {
                title: "Tailored Cover Letters",
                body: "Paste any job description and Lettr drafts a cover letter pulled straight from your resume — matched to the role, not a generic template.",
              },
              {
                title: "Resignation Letters",
                body: "Leaving a role? Generate a professional resignation letter in the tone you want — warm, neutral, or brief — in one click.",
              },
              {
                title: "AI Resume Agent",
                body: "Chat with an assistant that directly edits your resume: \"tighten my summary,\" \"add a bullet about the migration project\" — it just does it.",
              },
              {
                title: "Resume Quality Score",
                body: "A section-by-section breakdown of your resume's strength — independent of any specific job — so you always know what to fix next.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60} className="paper-sheet rounded-sm p-6">
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-navy-deep text-white">
        <div className="max-w-4xl mx-auto w-full px-8 py-20">
          <h2 className="font-display font-semibold text-3xl text-center mb-2">Why Lettr wins</h2>
          <p className="text-white/60 text-center mb-10">The difference between a document and a strategy.</p>

          <div className="rounded-sm overflow-hidden border border-white/10">
            <div className="grid grid-cols-2 bg-white/5 px-6 py-3 text-xs uppercase tracking-wide text-white/50">
              <span>Feature</span>
              <span>Lettr</span>
            </div>
            {[
              "ATS-optimized formatting",
              "Real-time keyword matching against a job description",
              "AI achievement rewriting",
              "Resume quality scoring",
              "AI resignation letters",
            ].map((feature, i) => (
              <div
                key={feature}
                className={`grid grid-cols-2 px-6 py-4 text-sm ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
              >
                <span className="text-white/80">{feature}</span>
                <span className="text-seal">✓ Included</span>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs text-center mt-4">
            Compared to writing a resume from scratch in a plain document editor.
          </p>
        </div>
      </section>

      {/* Feature spotlight tiles */}
      <section className="max-w-6xl mx-auto w-full px-8 py-20 grid md:grid-cols-2 gap-6">
        <div className="paper-sheet rounded-sm p-8">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Cover letter generator</p>
          <h3 className="font-display font-semibold text-xl mb-3">
            Written to bridge your resume and the job requirements.
          </h3>
          <p className="text-ink-soft text-sm mb-5">
            We analyze the job description and pull straight from your resume to write a letter that
            actually references your experience — not a fill-in-the-blank template.
          </p>
          <Link href="/signup" className="text-sm text-seal font-medium hover:underline">
            Start writing →
          </Link>
        </div>
        <div className="bg-ink text-white rounded-sm p-8">
          <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Resignation letters</p>
          <h3 className="font-display font-semibold text-xl mb-3">
            Leave on your terms, in the tone that fits.
          </h3>
          <p className="text-white/70 text-sm mb-5">
            Warm and appreciative, strictly neutral, or brief and to the point — generated from your
            role details in seconds.
          </p>
          <Link href="/signup" className="text-sm text-seal font-medium hover:underline">
            Generate a letter →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule bg-app-bg">
        <div className="max-w-3xl mx-auto w-full px-8 py-20 text-center">
          <h2 className="font-display font-semibold text-4xl mb-8">The smarter way to get hired.</h2>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
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

      <footer className="border-t border-rule px-8 py-10">
        <div className="max-w-6xl mx-auto w-full grid sm:grid-cols-4 gap-8">
          <div>
            <span className="font-display font-semibold text-lg">Lettr</span>
            <p className="text-xs text-ink-soft mt-2">© 2026 Lettr. All rights reserved.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Product</p>
            <div className="space-y-2 text-sm">
              <Link href="/templates" className="block hover:text-seal">Templates</Link>
              <Link href="/pricing" className="block hover:text-seal">Pricing</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Resources</p>
            <div className="space-y-2 text-sm">
              <Link href="/support" className="block hover:text-seal">Support</Link>
              <Link href="/privacy" className="block hover:text-seal">Privacy Policy</Link>
              <Link href="/terms" className="block hover:text-seal">Terms of Service</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Account</p>
            <div className="space-y-2 text-sm">
              <Link href="/login" className="block hover:text-seal">Sign in</Link>
              <Link href="/signup" className="block hover:text-seal">Create account</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
