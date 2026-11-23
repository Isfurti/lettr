import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

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
