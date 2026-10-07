import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/lib/examples";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/resume-checker`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/examples`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...EXAMPLES.map((e) => ({ url: `${baseUrl}/examples/${e.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${baseUrl}/tools/bullet-writer`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools/cover-letter-writer`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/whats-new`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/compare/rezi`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
