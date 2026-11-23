import * as Sentry from "@sentry/nextjs";

// Error reporting in the browser. Next.js runs this file before the app
// becomes interactive (the old sentry.client.config.ts is no longer loaded).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

// Ties page changes to Sentry's performance traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
