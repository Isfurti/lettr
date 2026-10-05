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

  // The root layout (and its stylesheet) is gone at this point, so this page styles itself.
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fffdf8", color: "#041632", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 460 }}>
            <div
              style={{
                width: 96, height: 96, margin: "0 auto 28px", borderRadius: "50%", background: "#ffc94d",
                boxShadow: "0 6px 0 #e0a800", transform: "rotate(8deg)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 44, fontWeight: 800,
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: 36, lineHeight: 1.1, margin: 0, fontWeight: 800 }}>Something went wrong.</h1>
            <p style={{ fontSize: 18, color: "#3b4256", margin: "14px 0 28px" }}>
              We&apos;ve been told about it. Your saved work is safe. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                minHeight: 48, padding: "0 26px", borderRadius: 999, border: 0, background: "#2f5bea", color: "#fff",
                fontSize: 16, fontWeight: 700, boxShadow: "0 5px 0 #1e3fb8", cursor: "pointer",
              }}
            >
              Reload the page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
