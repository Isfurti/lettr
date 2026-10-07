/**
 * The public address of the site, used for canonical links, the sitemap and
 * robots.txt. NEXTAUTH_URL wins; on Vercel we fall back to the project's
 * production domain so links never point at localhost.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}
