/**
 * Turns structured data into text that is safe to place inside a
 * <script type="application/ld+json"> tag. Escaping "<" stops any text
 * containing "</script>" from closing the tag early.
 */
export function jsonLdString(data: object | object[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; path: string };

/** A BreadcrumbList for a page, e.g. Home > Examples > Software Engineer. */
export function breadcrumbJsonLd(baseUrl: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${baseUrl}${c.path}`,
    })),
  };
}

/** FAQPage data from question and answer pairs. */
export function faqPageJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
