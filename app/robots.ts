import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Shared profiles (/p/...) are deliberately NOT disallowed here: a crawler that cannot fetch the page never sees its noindex tag
// and could list the bare link. They are kept out of search by noindex (metadata + X-Robots-Tag) and are not in the sitemap.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/templates", "/support", "/privacy", "/terms", "/login", "/signup"],
      disallow: ["/dashboard", "/builder", "/admin", "/api", "/verify-email", "/reset-password", "/forgot-password"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
