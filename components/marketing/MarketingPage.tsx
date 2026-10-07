import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

export const WRAP = "max-w-[1100px] mx-auto w-full px-4 sm:px-8";
export const H2 = "font-brand font-extrabold text-[28px] sm:text-[36px] leading-[1.1] tracking-tight";
export const BTN_BLUE =
  "btn-press inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)]";
export const BTN_OUTLINE = "btn-press inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-white border-2 border-ink font-bold";

/** Shared shell for the public content pages (tools, about, what's new, comparisons). */
export function MarketingPage({
  eyebrow,
  title,
  intro,
  children,
  jsonLd,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
  jsonLd?: object | object[];
}) {
  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <main className="flex-1">
        <header className={`${WRAP} pt-8 sm:pt-14 pb-8`}>
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand-blue">{eyebrow}</p>
          <h1 className="font-brand font-extrabold text-[36px] sm:text-[56px] leading-[1.02] tracking-tight mt-2 max-w-3xl">{title}</h1>
          <div className="mt-4 text-lg sm:text-xl text-slate max-w-2xl leading-relaxed">{intro}</div>
        </header>
        {children}
      </main>
      <Footer />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {items.map((f) => (
        <details key={f.q} className="group py-4">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-4 min-h-11 font-bold text-lg [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden="true" className="text-2xl text-brand-blue group-open:rotate-45 transition-transform">
              +
            </span>
          </summary>
          <p className="mt-2 text-slate leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

export function CtaBand({ title, text, href = "/builder/new", label = "Build my resume, free" }: { title: string; text: string; href?: string; label?: string }) {
  return (
    <section className="bg-ink text-white">
      <div className={`${WRAP} py-14 sm:py-20 text-center`}>
        <h2 className={H2}>{title}</h2>
        <p className="mt-3 text-lg text-white/80 max-w-xl mx-auto">{text}</p>
        <Link href={href} className="btn-press mt-6 inline-flex items-center min-h-12 px-7 rounded-full bg-gold text-ink font-extrabold shadow-[0_4px_0_var(--gold-deep)]">
          {label}
        </Link>
      </div>
    </section>
  );
}
