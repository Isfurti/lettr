import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) dynamically loads a worker file at runtime.
  // Next.js's bundler mangles that dynamic import path, so we tell it to
  // leave this package alone and let Node resolve it normally from
  // node_modules instead of bundling it.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

// withSentryConfig is a no-op wrapper if SENTRY_DSN isn't set - safe to
// leave in place even before Sentry is configured.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
