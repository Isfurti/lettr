import * as Sentry from "@sentry/nextjs";
import { scrubDeep } from "@/lib/sentry-scrub";

// Error reporting in the browser. Next.js runs this file before the app
// becomes interactive (the old sentry.client.config.ts is no longer loaded).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Shared profile links (/p/...) are private: keep them out of reports.
  beforeSend: (event) => scrubDeep(event),
  beforeSendTransaction: (event) => scrubDeep(event),
  beforeBreadcrumb: (crumb) => scrubDeep(crumb),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

// Ties page changes to Sentry's performance traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
