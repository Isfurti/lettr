import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, WRAP, CtaBand } from "@/components/marketing/MarketingPage";
import { getFeaturedReviews } from "@/lib/db";

export const metadata: Metadata = {
  title: "Lettr Reviews from Real Users | Lettr",
  description: "What people say about Lettr. Only real reviews from users who agreed to be shown, with first names only.",
  alternates: { canonical: "/reviews" },
};

export const revalidate = 3600;

export default async function ReviewsPage() {
  const reviews = await getFeaturedReviews(60).catch(() => []);
  return (
    <MarketingPage
      eyebrow="Reviews"
      title="What people say about Lettr"
      intro={<p>Only real reviews from Lettr users who agreed to be shown. First names only. We never write or edit them.</p>}
    >
      <section className={`${WRAP} pb-16`}>
        {reviews.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-rule rounded-[28px] p-8 text-center">
            <p className="font-brand font-extrabold text-2xl">Reviews are on their way</p>
            <p className="text-slate mt-2">
              Lettr is new, and we only show genuine reviews. Used Lettr?{" "}
              <Link href="/dashboard/feedback" className="font-bold text-brand-blue underline">
                Tell us how it went
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
            {reviews.map((r) => (
              <figure key={r.id} className="break-inside-avoid bg-white border-2 border-rule rounded-[24px] p-5">
                <p className="text-gold-deep" aria-label={`${r.rating} out of 5`}>
                  {"★".repeat(r.rating)}
                  <span className="text-rule">{"★".repeat(5 - r.rating)}</span>
                </p>
                <blockquote className="mt-2 leading-relaxed">&ldquo;{r.content}&rdquo;</blockquote>
                <figcaption className="mt-3 text-sm font-bold text-slate">{(r.user_name || "A Lettr user").split(" ")[0]}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
      <CtaBand title="Build yours" text="Free to start. See your ATS score before you apply." />
    </MarketingPage>
  );
}
