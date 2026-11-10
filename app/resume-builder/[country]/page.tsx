import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand, BTN_BLUE, BTN_OUTLINE } from "@/components/marketing/MarketingPage";
import { EXAMPLES } from "@/lib/examples";
import { COUNTRIES, getCountry, docWord } from "@/lib/countries";
import { siteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) return { title: "Page not found | Lettr" };
  const w = docWord(c);
  const title = `${c.term === "CV" ? "CV" : "Resume"} Builder for ${c.name}: ATS-Friendly ${c.term === "CV" ? "CV" : "Resume"} Maker | Lettr`;
  const description = `Build a ${w} that fits ${c.name}: ${c.paper} PDF, the right length and spelling, a live ATS score and AI help. See what employers there expect.`;
  const path = `/resume-builder/${c.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { images: [OG_IMAGE], title, description, url: path, locale: c.locale },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) notFound();
  const w = docWord(c);
  const W = w === "CV" ? "CV" : "Resume";
  const other = COUNTRIES.filter((x) => x.slug !== c.slug);
  const examples = c.examples.map((s) => EXAMPLES.find((e) => e.slug === s)).filter((e): e is (typeof EXAMPLES)[number] => Boolean(e));

  const rows: [string, string][] = [
    ["What it's called", `${c.term === "CV" ? "CV" : "Resume"} (people also search for \"${c.alt}\")`],
    ["Length", c.length],
    ["Paper size", c.paper],
    ["Photo", c.photo],
    ["Personal details", c.personal],
    ["Spelling", c.spelling],
    ["References", c.references],
  ];

  const faq = [
    { q: `How long should a ${w} be in ${c.name}?`, a: c.length },
    { q: `Should I put a photo on my ${w} for ${c.name}?`, a: c.photo },
    { q: `What paper size is used in ${c.name}?`, a: `${c.paper}. Lettr sets the page size for you when you pick where you're applying, and you can change it any time.` },
    { q: `Will my ${w} get through applicant tracking systems (ATS)?`, a: `Lettr's templates use single-column, real text that ATS software reads correctly, and the live ATS score shows what to fix. You can also upload an existing ${w} to the ATS checker.` },
  ];

  const url = `${siteUrl()}/resume-builder/${c.slug}`;
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Lettr", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Resume builder by country", item: `${siteUrl()}/resume-builder` },
      { "@type": "ListItem", position: 3, name: `${W} builder for ${c.name}`, item: url },
    ],
  };

  return (
    <MarketingPage
      eyebrow={`For ${c.name}`}
      title={`${W} builder for ${c.name}`}
      intro={
        <p>
          Build a {w} that matches what employers in {c.name} expect: the right length, {c.paper} page size and spelling. See your ATS score as you
          type, get AI help with your wording, then download a PDF.
        </p>
      }
      jsonLd={[faqJsonLd(faq), crumbs]}
    >
      <section className={`${WRAP} pb-14 flex flex-wrap gap-3`}>
        <Link href="/builder/new" className={BTN_BLUE}>
          Build my {w}
        </Link>
        <Link href="/resume-checker" className={BTN_OUTLINE}>
          Check my {w}
        </Link>
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>What employers in {c.name} expect</h2>
          <div className="mt-6 bg-cream border-2 border-rule rounded-[24px] overflow-x-auto">
            <table className="w-full min-w-[520px] text-left border-collapse">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-b border-rule/60 last:border-0 align-top">
                    <td className="py-3 px-5 font-bold w-48">{k}</td>
                    <td className="py-3 px-5 text-slate">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate">Norms vary by employer and industry. Follow the job post first.</p>
        </div>
      </section>

      <section className={`${WRAP} py-14`}>
        <h2 className={H2}>Three tips for {c.name}</h2>
        <ol className="mt-8 grid sm:grid-cols-3 gap-6">
          {c.tips.map((t, i) => (
            <li key={t} className="flex gap-4">
              <span className="w-9 h-9 shrink-0 rounded-full bg-ink text-gold font-brand font-extrabold flex items-center justify-center">{i + 1}</span>
              <p className="text-slate">{t}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 bg-cream rounded-[24px] border-2 border-rule p-6 sm:p-8 max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-wide text-brand-blue">How Lettr helps</p>
          <p className="mt-3 leading-relaxed">
            In the builder, pick <span className="font-bold">Applying in</span>{" "}to match your market. Lettr&apos;s AI suggestions, ATS tips and page
            size then follow that market&apos;s norms. You can also paste a job post to see which keywords your {w} is missing, and write a matching{" "}
            <Link href="/tools/cover-letter-writer" className="underline">
              cover letter
            </Link>
            .
          </p>
        </div>
      </section>

      {examples.length > 0 && (
        <section className="bg-white border-y border-rule">
          <div className={`${WRAP} py-14`}>
            <h2 className={H2}>Examples to start from</h2>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {examples.map((e) => (
                <li key={e.slug}>
                  <Link href={`/examples/${e.slug}`} className="flex items-center justify-between gap-3 min-h-14 px-5 rounded-2xl bg-cream border-2 border-rule hover:border-ink font-bold transition-colors">
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

      <section className={`${WRAP} py-14`}>
        <h2 className={`${H2} mb-6`}>Questions</h2>
        <Faq items={faq} />
      </section>

      <section className={`${WRAP} pb-14`}>
        <h2 className="font-extrabold text-xl">Applying somewhere else?</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {other.map((x) => (
            <li key={x.slug}>
              <Link href={`/resume-builder/${x.slug}`} className="inline-flex items-center min-h-11 px-4 rounded-full bg-white border-2 border-rule hover:border-ink font-bold">
                {x.name.replace(/^the /, "")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand title={`Make a ${w} that gets read`} text={`Built for ${c.name}, with a live ATS score and AI help.`} label={`Build my ${w}`} />
    </MarketingPage>
  );
}
