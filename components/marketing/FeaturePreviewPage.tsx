import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { siteUrl } from "@/lib/site-url";
import { getUserById } from "@/lib/db";
import type { FeaturePage } from "@/lib/feature-pages";
import { MarketingPage, WRAP, H2, Faq, faqJsonLd, CtaBand, BTN_BLUE, BTN_OUTLINE } from "@/components/marketing/MarketingPage";

function breadcrumbJsonLd(page: FeaturePage) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Lettr", item: base },
      { "@type": "ListItem", position: 2, name: page.title, item: `${base}/${page.slug}` },
    ],
  };
}

/** A public page that explains a signed-in tool. Signed-out visitors sign up and come back to the tool. */
export async function FeaturePreviewPage({ page }: { page: FeaturePage }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const user = userId ? await getUserById(userId) : undefined;
  const signedIn = Boolean(user);
  const signupHref = `/signup?continue=${page.continueKey}`;

  return (
    <MarketingPage eyebrow={page.eyebrow} title={page.title} intro={<p>{page.intro}</p>} jsonLd={[faqJsonLd(page.faq), breadcrumbJsonLd(page)]}>
      <section className={`${WRAP} pb-6 flex flex-wrap gap-3`}>
        {signedIn ? (
          <Link href={page.appHref} className={BTN_BLUE}>
            {page.openLabel}
          </Link>
        ) : (
          <>
            <Link href={signupHref} className={BTN_BLUE}>
              {page.signupLabel}
            </Link>
            <Link href={`/login?continue=${page.continueKey}`} className={BTN_OUTLINE}>
              I have an account
            </Link>
          </>
        )}
      </section>
      <p className={`${WRAP} pb-12 text-sm text-slate max-w-2xl`}>{page.accessNote}</p>

      <section className={`${WRAP} pb-14`}>
        <Image
          src={page.image}
          alt={page.imageAlt}
          width={1400}
          height={1000}
          priority
          className="w-full h-auto rounded-[24px] border-2 border-rule shadow-sm bg-white"
        />
      </section>

      <section className="bg-white border-y border-rule">
        <div className={`${WRAP} py-14`}>
          <h2 className={H2}>How it works</h2>
          <ol className="mt-6 grid md:grid-cols-3 gap-6">
            {page.steps.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="w-9 h-9 shrink-0 rounded-full bg-ink text-gold font-brand font-extrabold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-bold">{s.t}</p>
                  <p className="text-slate">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${WRAP} py-14`}>
        <h2 className={`${H2} mb-6`}>Questions</h2>
        <Faq items={page.faq} />
      </section>

      <CtaBand
        title="From Lettr to your offer letter."
        text="Resume, cover letter, interview and job tracker, in one place."
        href={signedIn ? page.appHref : signupHref}
        label={signedIn ? page.openLabel : page.signupLabel}
      />
    </MarketingPage>
  );
}
