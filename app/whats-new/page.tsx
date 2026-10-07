import type { Metadata } from "next";
import { MarketingPage, WRAP } from "@/components/marketing/MarketingPage";
import { CHANGELOG } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "What's New | Lettr",
  description: "The latest features and improvements in Lettr, the AI resume builder.",
  alternates: { canonical: "/whats-new" },
};

export default function WhatsNewPage() {
  return (
    <MarketingPage eyebrow="What's new" title="Recent updates" intro={<p>Everything we&apos;ve shipped lately, newest first.</p>}>
      <section className={`${WRAP} pb-16`}>
        <ol className="relative border-l-2 border-rule pl-6 sm:pl-8 space-y-10 max-w-3xl">
          {CHANGELOG.map((r) => (
            <li key={r.title} className="relative">
              <span aria-hidden="true" className="absolute -left-[33px] sm:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-brand-blue border-4 border-cream" />
              <p className="text-sm font-bold text-slate">
                {new Date(`${r.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h2 className="font-brand font-extrabold text-2xl mt-1">{r.title}</h2>
              <ul className="mt-3 space-y-1.5 list-disc pl-5 text-slate">
                {r.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </MarketingPage>
  );
}
