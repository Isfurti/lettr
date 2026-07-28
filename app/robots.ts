import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/templates", "/support", "/privacy", "/terms", "/login", "/signup"],
      disallow: ["/dashboard", "/builder", "/admin", "/api", "/verify-email", "/reset-password", "/forgot-password"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
