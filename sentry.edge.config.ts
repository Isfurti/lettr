import * as Sentry from "@sentry/nextjs";
import { scrubDeep } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Shared profile links (/p/...) are private: keep them out of reports.
  beforeSend: (event) => scrubDeep(event),
  beforeSendTransaction: (event) => scrubDeep(event),
  beforeBreadcrumb: (crumb) => scrubDeep(crumb),
  enabled: Boolean(process.env.SENTRY_DSN),
});
