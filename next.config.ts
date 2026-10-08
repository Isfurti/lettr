import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Basic security headers on every page. Microphone stays allowed for this
// site only (interview practice can listen to spoken answers).
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // pdf-parse (via pdfjs-dist) dynamically loads a worker file at runtime.
  // Next.js's bundler mangles that dynamic import path, so we tell it to
  // leave this package alone and let Node resolve it normally from
  // node_modules instead of bundling it.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // PDF export loads the same web fonts the live preview uses (lib/pdf-fonts.ts)
  // straight from node_modules at runtime. They're read with fs, so the bundler
  // can't see them - list them here so they ship with the routes that render PDFs.
  outputFileTracingIncludes: {
    "/api/resumes/pdf": ["./node_modules/@fontsource/*/files/*-latin-{400,600,700}-{normal,italic}.woff", "./node_modules/@fontsource/*/files/*-latin-ext-{400,700}-{normal,italic}.woff"],
    "/api/resumes/drive-export": ["./node_modules/@fontsource/*/files/*-latin-{400,600,700}-{normal,italic}.woff", "./node_modules/@fontsource/*/files/*-latin-ext-{400,700}-{normal,italic}.woff"],
    "/api/resumes/fit": ["./node_modules/@fontsource/*/files/*-latin-{400,600,700}-{normal,italic}.woff", "./node_modules/@fontsource/*/files/*-latin-ext-{400,700}-{normal,italic}.woff"],
    "/api/invoices/[id]/pdf": ["./node_modules/@fontsource/*/files/*-latin-{400,600,700}-{normal,italic}.woff", "./node_modules/@fontsource/*/files/*-latin-ext-{400,700}-{normal,italic}.woff"],
    "/api/admin/invoices/sample": ["./node_modules/@fontsource/*/files/*-latin-{400,600,700}-{normal,italic}.woff", "./node_modules/@fontsource/*/files/*-latin-ext-{400,700}-{normal,italic}.woff"],
  },
  // ...and keep the rest of those font packages (browser-only .woff2/.css) out of the server bundle.
  outputFileTracingExcludes: {
    "/api/resumes/pdf": ["./node_modules/@fontsource/**/*.{woff2,css}"],
    "/api/resumes/drive-export": ["./node_modules/@fontsource/**/*.{woff2,css}"],
    "/api/resumes/fit": ["./node_modules/@fontsource/**/*.{woff2,css}"],
    "/api/invoices/[id]/pdf": ["./node_modules/@fontsource/**/*.{woff2,css}"],
    "/api/admin/invoices/sample": ["./node_modules/@fontsource/**/*.{woff2,css}"],
  },
};

// withSentryConfig is a no-op wrapper if SENTRY_DSN isn't set - safe to
// leave in place even before Sentry is configured.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
