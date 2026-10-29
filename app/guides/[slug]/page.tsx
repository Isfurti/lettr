import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPage, WRAP, BTN_BLUE, CtaBand } from "@/components/marketing/MarketingPage";
import { GUIDES, getGuide } from "@/lib/guides";
import { getExample } from "@/lib/examples";
import { SELLER } from "@/lib/company";
import { formatDate } from "@/lib/format-date";
import { siteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: "Guide not found | Lettr" };
  return {
    title: `${g.title} | Lettr`,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
    images: [OG_IMAGE],
      type: "article",
      title: g.title,
      description: g.description,
      url: `/guides/${g.slug}`,
      publishedTime: g.published,
      modifiedTime: g.updated ?? g.published,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const base = siteUrl();
  const related = (g.relatedExamples ?? []).map((s) => getExample(s)).filter((e) => e !== undefined);
  const others = GUIDES.filter((x) => x.slug !== g.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      datePublished: g.published,
      dateModified: g.updated ?? g.published,
      mainEntityOfPage: `${base}/guides/${g.slug}`,
      author: { "@type": "Organization", name: "Lettr", url: base },
      publisher: { "@type": "Organization", name: SELLER?.legalName ?? "Lettr", ...(SELLER?.website ? { url: SELLER.website } : {}) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${base}/guides` },
        { "@type": "ListItem", position: 2, name: g.title, item: `${base}/guides/${g.slug}` },
      ],
    },
  ];

  return (
    <MarketingPage
      eyebrow="Guide"
      title={g.title}
      intro={
        <>
          <p className="text-sm font-bold text-slate">
            {formatDate(g.updated ?? g.published)} · {g.readMinutes} min read
          </p>
          <p className="mt-3">{g.intro}</p>
        </>
      }
      jsonLd={jsonLd}
    >
      <article className={`${WRAP} pb-14`}>
        <div className="max-w-2xl">
          {g.sections.map((s) => {
            const ListTag = s.ordered ? "ol" : "ul";
            return (
              <section key={s.heading} className="mt-10 first:mt-2">
                <h2 className="font-brand font-extrabold text-[24px] sm:text-[30px] leading-tight tracking-tight">{s.heading}</h2>
                {s.paragraphs?.map((p) => (
                  <p key={p} className="mt-4 text-[17px] leading-relaxed">
                    {p}
                  </p>
                ))}
                {s.list && (
                  <ListTag className={`mt-4 space-y-2.5 text-[17px] leading-relaxed pl-6 ${s.ordered ? "list-decimal" : "list-disc"} marker:text-brand-blue marker:font-bold`}>
                    {s.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ListTag>
                )}
              </section>
            );
          })}

          <div className="mt-12 bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-6 sm:p-7">
            <p className="font-extrabold text-lg">Ready to put this into practice?</p>
            <p className="mt-2 text-slate">Lettr gives you ATS-friendly templates, a live score and AI help that never makes things up. Free to start.</p>
            <Link href={g.cta.href} className={`${BTN_BLUE} mt-5`}>
              {g.cta.label}
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-white border-y border-rule">
          <div className={`${WRAP} py-12`}>
            <h2 className="font-brand font-extrabold text-[24px] sm:text-[28px] tracking-tight">Resume examples</h2>
            <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/examples/${e.slug}`}
                    className="flex items-center justify-between gap-3 min-h-14 px-5 rounded-2xl bg-cream border-2 border-rule hover:border-ink font-bold transition-colors"
                  >
                    {e.title}
                    <span aria-hidden="true" className="text-brand-blue">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className={`${WRAP} py-12`}>
        <h2 className="font-brand font-extrabold text-[24px] sm:text-[28px] tracking-tight">More guides</h2>
        <ul className="mt-4 flex flex-col">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/guides/${o.slug}`} className="inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline">
                {o.title} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand title="Build a resume that gets read" text="Clean templates, a live ATS score and AI help, all free to start." />
    </MarketingPage>
  );
}
