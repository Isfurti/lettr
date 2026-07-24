"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>The error has been reported. Please try again.</p>
        </div>
      </body>
    </html>
  );
}
