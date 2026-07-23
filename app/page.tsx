import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <span className="font-display font-bold text-xl tracking-tight">Lettr</span>
        <nav className="flex items-center gap-6 text-sm text-ink-soft">
          <Link href="/login" className="hover:text-ink">Log in</Link>
          <Link
            href="/signup"
            className="bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink/90 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto w-full px-8 pt-12 pb-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="uppercase tracking-[0.18em] text-xs text-seal font-mono mb-4">
            AI resume builder
          </p>
          <h1 className="font-display text-5xl leading-[1.05] font-bold mb-6">
            Write the resume that gets past the filter.
          </h1>
          <p className="text-ink-soft text-lg leading-relaxed mb-8 max-w-md">
            Paste a job description. Lettr scores your resume against it, tells you
            exactly which keywords are missing, and rewrites your bullets to match —
            then drafts the cover letter too.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-seal text-white px-6 py-3 rounded-sm font-medium hover:opacity-90 transition-opacity"
          >
            Build your resume — free
          </Link>
        </div>

        <div className="paper-sheet rounded-sm p-8 rotate-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-3 w-32 bg-ink/80 rounded-sm mb-2" />
              <div className="h-2 w-48 bg-ink-soft/40 rounded-sm" />
            </div>
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--rule)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="var(--seal)" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34 * 0.87} ${2 * Math.PI * 34}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-sm">
                87
              </span>
            </div>
          </div>
          {[1, 0.9, 0.75, 0.85, 0.6].map((w, i) => (
            <div key={i} className="h-2 bg-ink-soft/20 rounded-sm mb-3" style={{ width: `${w * 100}%` }} />
          ))}
          <div className="mt-6 pt-4 border-t border-rule flex flex-wrap gap-2">
            {["Django", "PostgreSQL", "AWS", "CI/CD"].map((kw) => (
              <span key={kw} className="text-xs font-mono bg-seal-soft text-seal px-2 py-1 rounded-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="max-w-6xl mx-auto w-full px-8 py-16 grid md:grid-cols-3 gap-10">
          {[
            {
              title: "ATS match score",
              body: "Paste any job description and see exactly how your resume scores, plus the missing keywords costing you interviews.",
            },
            {
              title: "AI bullet rewriting",
              body: "Turn a rough accomplishment into three achievement-focused, ATS-friendly bullet options in seconds.",
            },
            {
              title: "Tailored cover letters",
              body: "Generate a cover letter pulled straight from your resume and matched to the target role — no blank page.",
            },
          ].map((f) => (
            <div key={f.title}>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-rule px-8 py-6 text-xs text-ink-soft max-w-6xl mx-auto w-full">
        Lettr — built for job seekers, not recruiters.
      </footer>
    </main>
  );
}
