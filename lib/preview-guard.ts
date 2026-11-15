/**
 * Stops a Vercel preview deployment from using the production database.
 *
 * Previews run code from unmerged branches, so they must only ever talk to a
 * separate staging database. On a preview, the host of DATABASE_URL has to
 * match PREVIEW_DATABASE_HOST, a plain (non-secret) variable that is set for
 * the Preview environment only, next to the staging DATABASE_URL.
 * If someone re-enables Preview on the production DATABASE_URL, the hosts
 * differ and the preview refuses to start instead of touching live data.
 * Setup steps: docs/staging.md.
 */
export function assertPreviewUsesStagingDatabase(
  connectionString: string,
  env: Record<string, string | undefined> = process.env
): void {
  if (env.VERCEL_ENV !== "preview") return; // production, local development and tests are unaffected

  const allowed = env.PREVIEW_DATABASE_HOST?.trim().toLowerCase();
  let host = "";
  try {
    host = new URL(connectionString).hostname.toLowerCase();
  } catch {
    // an unreadable URL can't be shown to be the staging database
  }
  if (!allowed || !host || host !== allowed) {
    throw new Error(
      "This is a preview deployment, and its DATABASE_URL is not the staging database. " +
        "Previews must not use the production database. Set DATABASE_URL (Preview only) to the staging database " +
        "and PREVIEW_DATABASE_HOST (Preview only) to its host name. See docs/staging.md."
    );
  }
}
