import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { TryItDemo } from "@/components/home/TryItDemo";
import { CareerStages } from "@/components/home/CareerStages";
import { ResumeShot, BeforeResume } from "@/components/home/ResumeShot";
import { HERO_EXAMPLE, AFTER_EXAMPLE } from "@/lib/home-examples";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
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

const WRAP = "max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14";
const BTN_BLUE =
  "btn-press inline-flex items-center justify-center min-h-12 px-7 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]";
const BTN_OUTLINE =
  "btn-press inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-white text-ink font-bold border-2 border-ink";
const H2 = "font-brand font-extrabold text-[34px] sm:text-[48px] leading-[1.05] tracking-tight";

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-sm font-extrabold uppercase tracking-[0.12em] mb-3 ${dark ? "text-gold" : "text-brand-blue"}`}>
      {children}
    </p>
  );
}

function Tick({ color = "var(--brand-blue)" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-[3px]">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const BEFORE_AFTER_POINTS = [
  { t: "Results, not duties", b: "\"Responsible for sales\" becomes what actually changed because of you." },
  { t: "A summary that says something", b: "No more \"reputed organisation\". One line on what you're great at." },
  { t: "Skills the job asks for", b: "Job match shows the keywords in the post that your resume is missing." },
  { t: "A clean, readable layout", b: "Templates built to be read by people and parsed by hiring software." },
];

const JOURNEY = [
  { n: "1", t: "Get noticed", b: "Start from a guided form or import the resume you already have. A live score shows what to fix next." },
  { n: "2", t: "Match the job", b: "Paste a job post. See your match score and the exact keywords you're missing." },
  { n: "3", t: "Polish with AI", b: "Rewrite weak bullets in one tap. Cover letters and the Resume Agent come with Pro." },
  { n: "4", t: "Download & apply", b: "Pick a template and download a clean PDF, ready for any job site or email." },
];

const HOW_YOU_HUNT = [
  { t: "Works on your phone", b: "Build, edit and download from the browser on any phone. No app to install." },
  { t: "Priced for your country", b: "Pro costs what's fair where you live, shown in your currency." },
  { t: "Readable by hiring software", b: "Simple, single-column-friendly templates that applicant tracking systems can parse." },
  { t: "Bring your old resume", b: "Upload a PDF or Word file and Lettr fills in the form for you (free account needed)." },
];

const GALLERY = [
  { id: "classic", name: "Classic", pro: false },
  { id: "modern", name: "Modern", pro: false },
  { id: "bold", name: "Bold", pro: true },
  { id: "elegant", name: "Elegant", pro: true },
];

const FAQ = [
  {
    q: "Is Lettr really free?",
    a: "Yes. The free plan gives you one resume, the Classic and Modern templates, 3 PDF downloads and 5 AI rewrites. No card needed. Pro unlocks everything else.",
  },
  {
    q: "Do I need an account to start?",
    a: "No. You can start building straight away. You'll create a free account when you want to download or save your resume.",
  },
  {
    q: "Will my resume get past applicant tracking systems?",
    a: "Lettr's templates use real text and simple structure so hiring software can read them. Job match also shows the keywords a job post asks for, so you can add the ones you genuinely have.",
  },
  {
    q: "Does the AI make things up?",
    a: "No. It rewrites what you tell it. When a number would help but you haven't given one, it leaves a blank like [X]% for you to fill in with the real figure.",
  },
  {
    q: "What does Pro cost?",
    a: "It depends on your country, and you'll always see the price in your currency before you pay. See the pricing page for yours.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Cancel from the billing portal in your dashboard and you keep Pro until the end of the period you've paid for.",
  },
];

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
    <main className="flex-1 flex flex-col bg-cream text-ink overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicNav />

      {/* Hero */}
      <section className={`${WRAP} pt-10 sm:pt-16 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center`}>
        <div className="rise">
          <p className="inline-flex items-center gap-2 bg-gold-soft text-ink text-sm font-bold px-3.5 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-gold-deep" aria-hidden="true" />
            Free to start · No card needed
          </p>
          <h1 className="font-brand font-extrabold text-[44px] sm:text-[64px] lg:text-[72px] leading-[1] tracking-tight">
            Make your resume{" "}
            <span className="relative whitespace-nowrap">
              <span aria-hidden="true" className="absolute inset-x-[-4px] bottom-[6%] h-[38%] bg-gold -z-0 rounded-sm -rotate-1" />
              <span className="relative">impossible</span>
            </span>{" "}
            to skip.
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate max-w-xl">
            Lettr shows you what&apos;s weak, helps you fix it with AI, and matches your resume to the job, so it reads
            like the person they want to hire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/builder/new" className={BTN_BLUE}>
              Build my resume
            </Link>
            <a href="#before-after" className={BTN_OUTLINE}>
              See a before and after
            </a>
          </div>
          <Link
            href="/signup?continue=import"
            className="lift mt-8 flex items-center gap-4 max-w-md border-2 border-dashed border-[#C9D1E3] hover:border-brand-blue rounded-2xl p-4 bg-white/70 transition-colors"
          >
            <span aria-hidden="true" className="w-11 h-11 shrink-0 rounded-xl bg-brand-blue-soft flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
              </svg>
            </span>
            <span>
              <span className="block font-bold">Already have a resume?</span>
              <span className="block text-sm text-slate">Upload a PDF or Word file and we&apos;ll fill it in for you.</span>
            </span>
          </Link>
        </div>

        <div className="relative mx-auto lg:mx-0 lg:justify-self-end" style={{ width: "min(440px, 78vw)" }}>
          <div className="relative">
          <div className="float-tilted">
            <ResumeShot template="modern" data={HERO_EXAMPLE} width="100%" />
          </div>
          <div className="pop-in absolute -right-2 sm:-right-6 -top-5 w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-full bg-gold text-ink flex flex-col items-center justify-center rotate-[8deg] shadow-[0_8px_0_var(--gold-deep)]">
            <span className="font-brand font-extrabold text-[34px] sm:text-[40px] leading-none">92</span>
            <span className="text-[11px] font-extrabold mt-1">Resume score</span>
          </div>
          <div className="absolute -left-3 sm:-left-8 -bottom-5 bg-white border-2 border-ink rounded-full px-3.5 py-2 text-sm font-bold shadow-[4px_4px_0_var(--ink)] flex items-center gap-1.5">
            <Tick /> Numbers that prove it
          </div>
          <div className="absolute -right-2 sm:-right-6 -bottom-5 bg-white border-2 border-ink rounded-full px-3.5 py-2 text-sm font-bold shadow-[4px_4px_0_var(--ink)] hidden sm:flex items-center gap-1.5">
            <Tick /> Matches the job post
          </div>
          </div>
          <p className="mt-12 text-center text-xs text-ink-soft">Example resume in the Modern template</p>
        </div>
      </section>

      {/* Try it */}
      <section className="bg-sand border-y border-rule">
        <div className={`${WRAP} py-16 sm:py-24`}>
          <Reveal className="max-w-2xl mb-10">
            <Eyebrow>Try it, right here</Eyebrow>
            <h2 className={H2}>Tap a note. Watch it get better.</h2>
            <p className="mt-4 text-lg text-slate">
              This is how Lettr works on your own resume: it points out what&apos;s holding you back and helps you fix it.
            </p>
          </Reveal>
          <TryItDemo />
        </div>
      </section>

      {/* Before / after */}
      <section id="before-after" className={`${WRAP} py-16 sm:py-24 scroll-mt-20`}>
        <Reveal className="max-w-2xl mb-12">
          <Eyebrow>Before and after</Eyebrow>
          <h2 className={H2}>Same person. Same job. A very different first impression.</h2>
        </Reveal>
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-10 items-center justify-items-center">
          <Reveal className="flex flex-col items-center gap-4">
            <span className="bg-white border-2 border-[#C9D1E3] text-slate font-bold text-sm px-3.5 py-1.5 rounded-full">Before</span>
            <BeforeResume width="min(340px, 82vw)" />
          </Reveal>
          <div aria-hidden="true" className="w-14 h-14 rounded-full bg-gold flex items-center justify-center rotate-90 lg:rotate-0 shadow-[0_5px_0_var(--gold-deep)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </div>
          <Reveal delay={120} className="flex flex-col items-center gap-4">
            <span className="bg-brand-blue text-white font-bold text-sm px-3.5 py-1.5 rounded-full">After Lettr</span>
            <ResumeShot template="classic" data={AFTER_EXAMPLE} width="min(340px, 82vw)" />
          </Reveal>
        </div>
        <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BEFORE_AFTER_POINTS.map((p, i) => (
            <Reveal key={p.t} delay={i * 60} className="bg-white border-2 border-ink rounded-3xl p-6 shadow-[5px_5px_0_var(--ink)]">
              <li className="list-none">
                <span className="font-brand font-extrabold text-gold-deep text-2xl">{i + 1}</span>
                <p className="mt-2 font-extrabold text-lg leading-snug">{p.t}</p>
                <p className="mt-2 text-slate leading-relaxed">{p.b}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <p className="mt-6 text-sm text-ink-soft">Illustrative example. Your results depend on your own experience and the jobs you apply for.</p>
      </section>

      {/* Job match */}
      <section className="bg-sand border-y border-rule">
        <div className={`${WRAP} py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center`}>
          <Reveal>
            <Eyebrow>Job match</Eyebrow>
            <h2 className={H2}>See what the job post is looking for.</h2>
            <p className="mt-5 text-lg text-slate leading-relaxed">
              Many companies use software to sort applications by keywords. Paste any job post and Lettr shows your
              match score, the keywords you already cover, and the ones you&apos;re missing.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-base">
              <li className="flex gap-3"><Tick /> Free on every plan</li>
              <li className="flex gap-3"><Tick /> Add only the skills you really have</li>
              <li className="flex gap-3"><Tick /> Re-check as you edit</li>
            </ul>
          </Reveal>
          <Reveal delay={120} className="bg-white border-2 border-ink rounded-[28px] shadow-[8px_8px_0_var(--ink)] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate">Product Marketing Manager · Brightline</p>
                <p className="font-brand font-extrabold text-2xl mt-1">Job match</p>
              </div>
              <div className="w-20 h-20 shrink-0 rounded-full border-[6px] border-brand-blue flex items-center justify-center font-brand font-extrabold text-2xl">
                78%
              </div>
            </div>
            <p className="mt-6 text-sm font-extrabold">You have</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Positioning", "Product launches", "HubSpot", "SEO", "Email marketing", "Stakeholder management"].map((k) => (
                <span key={k} className="bg-brand-blue-soft text-brand-blue-deep text-sm font-bold px-3 py-1.5 rounded-full">{k}</span>
              ))}
            </div>
            <p className="mt-5 text-sm font-extrabold">Missing from your resume</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["SQL", "A/B testing", "Pricing strategy"].map((k) => (
                <span key={k} className="bg-gold-soft text-ink text-sm font-bold px-3 py-1.5 rounded-full border border-dashed border-gold-deep">+ {k}</span>
              ))}
            </div>
            <p className="mt-6 text-xs text-ink-soft">Example only.</p>
          </Reveal>
        </div>
      </section>

      {/* Journey */}
      <section id="how" className="bg-ink text-white scroll-mt-20">
        <div className={`${WRAP} py-16 sm:py-24`}>
          <Reveal className="max-w-2xl mb-12">
            <Eyebrow dark>How it works</Eyebrow>
            <h2 className={H2}>From blank page to &ldquo;we&apos;d like to talk&rdquo;.</h2>
          </Reveal>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {JOURNEY.map((s, i) => (
              <Reveal key={s.n} delay={i * 80} className="rounded-3xl bg-white/[0.06] border border-white/15 p-6">
                <li className="list-none">
                  <span className="w-11 h-11 rounded-full bg-gold text-ink font-brand font-extrabold text-xl flex items-center justify-center">{s.n}</span>
                  <p className="mt-5 font-brand font-extrabold text-2xl">{s.t}</p>
                  <p className="mt-2 text-white/75 leading-relaxed">{s.b}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="mt-12">
            <Link href="/builder/new" className="btn-press inline-flex items-center min-h-12 px-7 rounded-full bg-gold text-ink font-extrabold shadow-[0_5px_0_var(--gold-deep)]">
              Start building, free
            </Link>
          </div>
        </div>
      </section>

      {/* Career stages */}
      <section id="for-you" className={`${WRAP} py-16 sm:py-24 scroll-mt-20`}>
        <Reveal className="max-w-2xl mb-10">
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className={H2}>Wherever you are in your career.</h2>
          <p className="mt-4 text-lg text-slate">Pick the one that sounds like you.</p>
        </Reveal>
        <CareerStages />
      </section>

      {/* Made for how you job hunt */}
      <section className="bg-sand border-y border-rule">
        <div className={`${WRAP} py-16 sm:py-24`}>
          <Reveal className="max-w-2xl mb-10">
            <Eyebrow>Made for real life</Eyebrow>
            <h2 className={H2}>Built for how you actually job hunt.</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_YOU_HUNT.map((f, i) => (
              <Reveal key={f.t} delay={i * 60} className="lift bg-white rounded-3xl border border-rule p-6">
                <p className="font-extrabold text-lg">{f.t}</p>
                <p className="mt-2 text-slate leading-relaxed">{f.b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className={`${WRAP} py-16 sm:py-24`}>
        <Reveal className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <Eyebrow>Templates</Eyebrow>
            <h2 className={H2}>Look the part. Pick a template.</h2>
          </div>
          <Link href="/templates" className={BTN_OUTLINE}>
            See all 10 templates
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {GALLERY.map((t, i) => (
            <Reveal key={t.id} delay={i * 60}>
              <Link href="/templates" className="lift block group">
                <ResumeShot template={t.id} data={SAMPLE_RESUME} width="100%" />
                <p className="mt-3 flex items-center gap-2 font-bold group-hover:text-brand-blue transition-colors">
                  {t.name}
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${t.pro ? "bg-ink text-gold" : "bg-gold text-ink"}`}>
                    {t.pro ? "Pro" : "Free"}
                  </span>
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Real user reviews - only shown once at least one exists and has been
          admin-approved for public display. No placeholder content here on
          purpose - an empty section beats a fabricated one. */}
      {featuredReviews.length > 0 && (
        <section className="bg-sand border-y border-rule">
          <div className={`${WRAP} py-16 sm:py-24`}>
            <Reveal className="max-w-2xl mb-10">
              <Eyebrow>From Lettr users</Eyebrow>
              <h2 className={H2}>Real feedback, unedited.</h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {featuredReviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 60} className="bg-white rounded-3xl border border-rule p-6 flex flex-col">
                  <p className="text-gold-deep text-lg" aria-label={`${r.rating} out of 5 stars`}>
                    {"★".repeat(r.rating)}
                    <span className="text-[#D9DEEA]">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <p className="mt-3 leading-relaxed flex-1">&ldquo;{r.content}&rdquo;</p>
                  <p className="mt-4 text-sm text-slate font-bold">{r.user_name ? r.user_name.split(" ")[0] : "A Lettr user"}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing teaser */}
      <section className={`${WRAP} py-16 sm:py-24`}>
        <Reveal className="max-w-2xl mb-10">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className={H2}>Start free. Upgrade when it&apos;s worth it.</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Reveal className="bg-white rounded-[28px] border-2 border-rule p-7 flex flex-col">
            <p className="font-brand font-extrabold text-3xl">Free</p>
            <p className="mt-1 text-slate">Everything you need for one strong resume.</p>
            <ul className="mt-6 flex flex-col gap-3 flex-1">
              {["1 resume", "Classic and Modern templates", "3 PDF downloads", "5 AI rewrites", "Job match and resume score"].map((x) => (
                <li key={x} className="flex gap-3"><Tick />{x}</li>
              ))}
            </ul>
            <Link href="/builder/new" className={`${BTN_OUTLINE} mt-8 self-start`}>Start free</Link>
          </Reveal>
          <Reveal delay={100} className="bg-ink text-white rounded-[28px] p-7 flex flex-col shadow-[8px_8px_0_var(--gold)]">
            <div className="flex items-center gap-3">
              <p className="font-brand font-extrabold text-3xl">Pro</p>
              <span className="bg-gold text-ink text-xs font-extrabold px-2.5 py-1 rounded-full">Priced for your country</span>
            </div>
            <p className="mt-1 text-white/70">For when you&apos;re applying seriously.</p>
            <ul className="mt-6 flex flex-col gap-3 flex-1">
              {["Unlimited resumes, downloads and AI rewrites", "All 10 templates", "Cover letters and resignation letters", "AI Resume Agent", "Word (DOCX) export"].map((x) => (
                <li key={x} className="flex gap-3"><Tick color="var(--gold)" />{x}</li>
              ))}
            </ul>
            <Link href="/pricing" className="btn-press mt-8 self-start inline-flex items-center min-h-12 px-7 rounded-full bg-gold text-ink font-extrabold shadow-[0_5px_0_var(--gold-deep)]">
              See price in your currency
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sand border-y border-rule">
        <div className={`${WRAP} py-16 sm:py-24 grid lg:grid-cols-[1fr_1.6fr] gap-10`}>
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 className={H2}>Good to know.</h2>
            <p className="mt-4 text-slate">
              Something else?{" "}
              <Link href="/support" className="font-bold text-brand-blue hover:underline">Ask us</Link>.
            </p>
          </Reveal>
          <div className="flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-rule open:border-ink transition-colors">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 min-h-14 px-5 py-4 font-bold text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center text-xl font-extrabold transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-slate leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className={`${WRAP} py-16 sm:py-24`}>
        <div className="relative overflow-hidden bg-brand-blue text-white rounded-[36px] px-6 sm:px-14 py-14 sm:py-20 text-center">
          <span aria-hidden="true" className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-gold/25" />
          <h2 className="relative font-brand font-extrabold text-[36px] sm:text-[56px] leading-[1.02] tracking-tight">
            Your next job starts with one good page.
          </h2>
          <p className="relative mt-4 text-lg text-white/85">Free to start. No card needed.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/builder/new" className="btn-press inline-flex items-center min-h-12 px-8 rounded-full bg-gold text-ink font-extrabold shadow-[0_5px_0_var(--gold-deep)]">
              Build my resume
            </Link>
            <Link href="/templates" className="btn-press inline-flex items-center min-h-12 px-7 rounded-full border-2 border-white text-white font-bold">
              Browse templates
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
