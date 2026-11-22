import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/lib/examples";
import { GUIDES } from "@/lib/guides";
import { COUNTRIES } from "@/lib/countries";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();
  // Only pages with a real date get one. A made-up "changed now" on every page
  // teaches Google to ignore the date, so the rest leave it out.
  const guideTimes = GUIDES.map((g) => new Date(g.updated ?? g.published).getTime());
  const latestGuide = guideTimes.length ? new Date(Math.max(...guideTimes)) : undefined;

  return [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/templates`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/resume-checker`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/examples`, changeFrequency: "weekly", priority: 0.9 },
    ...EXAMPLES.map((e) => ({ url: `${baseUrl}/examples/${e.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${baseUrl}/resume-builder-for-freshers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/cv-builder`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/resume-builder`, changeFrequency: "monthly", priority: 0.8 },
    ...COUNTRIES.map((c) => ({ url: `${baseUrl}/resume-builder/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${baseUrl}/guides`, lastModified: latestGuide, changeFrequency: "weekly", priority: 0.7 },
    ...GUIDES.map((g) => ({ url: `${baseUrl}/guides/${g.slug}`, lastModified: new Date(g.updated ?? g.published), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${baseUrl}/tools/bullet-writer`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools/cover-letter-writer`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/whats-new`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/reviews`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.6 },
    // /login is marked noindex, so it isn't listed here.
    { url: `${baseUrl}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/delivery-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
