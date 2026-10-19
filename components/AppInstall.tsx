"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registers the service worker (production only), which makes Lettr installable. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Not critical: the site works the same without it.
    });
  }, []);
  return null;
}

/** iPhone and iPad (iPadOS reports itself as a Mac with a touch screen). */
function isAppleMobile(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** Already opened from the home screen, so there's nothing to install. */
function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/**
 * "Install the app" button. On Android, Chrome and Edge it opens the
 * browser's own install prompt. iPhones and iPads have no install prompt, so
 * there it shows how to add Lettr to the home screen from the Share menu.
 * Hidden when Lettr is already installed or the browser can't install it.
 */
export function InstallAppButton({
  className = "",
  icon,
  label = "Install the Lettr app",
  onDone,
}: {
  className?: string;
  /** Shown before the label, to line up with the icons in a menu. */
  icon?: React.ReactNode;
  label?: string;
  /** Called after the prompt or the instructions close (e.g. to close a menu). */
  onDone?: () => void;
}) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [apple, setApple] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    // Decided after the page loads, so server and browser render the same thing first.
    const id = window.setTimeout(() => setApple(isAppleMobile()), 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (!evt && !apple) return null;
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (evt) {
            await evt.prompt();
            await evt.userChoice.catch(() => null);
            setEvt(null);
            onDone?.();
          } else {
            setShowSteps(true);
          }
        }}
        className={className}
      >
        {icon}
        {label}
      </button>
      {showSteps && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-steps-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/60 p-4"
          onClick={() => {
            setShowSteps(false);
            onDone?.();
          }}
        >
          <div className="w-full max-w-sm rounded-[28px] bg-white text-ink p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="install-steps-title" className="font-brand font-extrabold text-2xl">
              Add Lettr to your home screen
            </h2>
            <ol className="mt-4 space-y-3 text-[15px]">
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gold font-extrabold flex items-center justify-center">1</span>
                <span>
                  Tap the <b>Share</b> button
                  <svg aria-hidden="true" className="inline-block mx-1 -mt-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
                  in Safari or Chrome.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gold font-extrabold flex items-center justify-center">2</span>
                <span>
                  Scroll down and tap <b>Add to Home Screen</b>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gold font-extrabold flex items-center justify-center">3</span>
                <span>
                  Tap <b>Add</b>. Lettr opens from your home screen like any other app.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                setShowSteps(false);
                onDone?.();
              }}
              className="btn-press mt-6 w-full min-h-12 rounded-full bg-ink text-white font-extrabold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
