import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { ResumeShot } from "@/components/home/ResumeShot";
import { UseExampleButton } from "@/components/examples/UseExampleButton";
import { LazyResumeShot } from "@/components/examples/LazyResumeShot";
import { EXAMPLES, getExample } from "@/lib/examples";
import { isTemplateFree } from "@/lib/templates";

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = getExample(slug);
  if (!e) return { title: "Example not found | Lettr" };
  return {
    title: `${e.title} Resume Example | Lettr`,
    description: `A ${e.stage.toLowerCase()} ${e.title.toLowerCase()} resume example with tips on why it works. Use it as your starting point for free.`,
    alternates: { canonical: `/examples/${e.slug}` },
  };
}

export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = getExample(slug);
  if (!e) notFound();
  const related = EXAMPLES.filter((x) => x.category === e.category && x.slug !== e.slug).slice(0, 4);
  const templateName = e.template[0].toUpperCase() + e.template.slice(1);

  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <main className="flex-1 max-w-[1180px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-slate mb-6">
          <Link href="/examples" className="font-bold text-brand-blue hover:underline inline-flex items-center min-h-10">
            ← All examples
          </Link>
          <span className="mx-2">/</span>
          {e.category}
        </nav>

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-start">
          <div className="mx-auto lg:mx-0 w-full" style={{ maxWidth: 560 }}>
            <ResumeShot template={e.template} data={e.resume} width="100%" />
            <p className="mt-4 text-sm text-slate text-center">
              {templateName} template{isTemplateFree(e.template) ? " (free)" : " (Pro)"} · Example only, made-up person
            </p>
          </div>

          <div className="lg:sticky lg:top-8 flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gold text-ink text-xs font-extrabold px-2.5 py-1 rounded-full">{e.stage}</span>
                <span className="bg-white border border-rule text-xs font-bold px-2.5 py-1 rounded-full">{e.category}</span>
              </div>
              <h1 className="font-brand font-extrabold text-[34px] sm:text-[44px] leading-[1.05] tracking-tight">
                {e.title} resume example
              </h1>
            </div>

            <div className="bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-6 sm:p-7">
              <p className="font-extrabold text-lg">Why this works</p>
              <ul className="mt-3 flex flex-col gap-3">
                {e.why.map((w) => (
                  <li key={w} className="flex gap-3 items-start leading-relaxed">
                    <span aria-hidden="true" className="shrink-0 mt-1 w-5 h-5 rounded-md bg-brand-blue-soft flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <UseExampleButton data={e.resume} template={e.template} />
              </div>
              <p className="mt-3 text-sm text-slate">
                Opens in the builder so you can replace the details with your own. Numbers are examples: use your real ones.
              </p>
            </div>

            <div className="bg-brand-blue-soft rounded-[24px] p-6">
              <p className="font-extrabold">Already have a resume?</p>
              <p className="mt-1 text-slate">See how it compares: get a free score and the fixes that matter.</p>
              <Link
                href="/resume-checker"
                className="btn-press mt-4 inline-flex items-center min-h-11 px-5 rounded-full bg-white border-2 border-ink font-bold"
              >
                Check my resume free
              </Link>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <h2 className="font-brand font-extrabold text-[28px] sm:text-[36px] tracking-tight mb-8">More {e.category.toLowerCase()} examples</h2>
            <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {related.map((r) => (
                <Link key={r.slug} href={`/examples/${r.slug}`} className="group flex flex-col">
                  <div className="lift bg-white rounded-2xl border border-rule p-3 shadow-[0_10px_24px_rgba(4,22,50,0.08)]">
                    <LazyResumeShot template={r.template} data={r.resume} />
                  </div>
                  <p className="mt-4 font-brand font-extrabold text-lg leading-snug group-hover:text-brand-blue transition-colors">{r.title}</p>
                  <p className="text-sm text-slate">{r.stage}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
