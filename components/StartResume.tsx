"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Signed-in user with no resume to open: make one and go straight to the
 * builder. Runs in the browser (not while the page renders) so link
 * prefetching can never create resumes by accident.
 */
export function StartResume({ template, fallbackId }: { template: string; fallbackId?: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Untitled Resume", template }),
        });
        if (res.ok) {
          const body = await res.json();
          router.replace(`/builder/${body.id}`);
          return;
        }
        // Plan limit or locked template: open their existing resume instead.
        if (res.status === 402) {
          router.replace(fallbackId ? `/builder/${fallbackId}` : "/pricing");
          return;
        }
        setFailed(true);
      } catch {
        setFailed(true);
      }
    })();
  }, [template, fallbackId, router]);

  return (
    <main id="main" className="flex-1 flex items-center justify-center px-4 py-20 bg-cream text-ink">
      {failed ? (
        <div className="text-center">
          <h1 className="font-brand font-extrabold text-2xl mb-2">We couldn&apos;t start your resume</h1>
          <p className="text-ink-soft mb-5">Please try again from your dashboard.</p>
          <Link href="/dashboard" className="font-bold text-brand-blue hover:underline">
            Go to dashboard →
          </Link>
        </div>
      ) : (
        <h1 className="font-brand font-extrabold text-2xl" role="status">
          Opening the builder…
        </h1>
      )}
    </main>
  );
}
