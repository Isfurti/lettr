"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Script from "next/script";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADS_ID,
  GA_ID,
  META_PIXEL_ID,
  OPEN_CONSENT_EVENT,
  readConsent,
  saveConsent,
  trackingConfigured,
  type Consent,
} from "@/lib/analytics";

const CONSENT_CHANGED_EVENT = "lettr:cookie-consent-changed";
function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const REGION_KEY = "lettr-consent-required";

/** Asks the server whether this visitor's country needs an opt-in, remembered for the browser session. */
async function fetchConsentRequired(): Promise<boolean> {
  try {
    const saved = window.sessionStorage.getItem(REGION_KEY);
    if (saved === "1" || saved === "0") return saved === "1";
  } catch {
    // storage blocked: just ask the server
  }
  try {
    const res = await fetch("/api/consent-region", { cache: "no-store" });
    const body = (await res.json()) as { required?: boolean };
    const required = body.required !== false;
    try {
      window.sessionStorage.setItem(REGION_KEY, required ? "1" : "0");
    } catch {
      // fine
    }
    return required;
  } catch {
    return true; // can't tell where they are: ask, to be safe
  }
}

/**
 * Loads Google Analytics, Google Ads and the Meta Pixel.
 *
 * In the EU, EEA, UK and Switzerland they load only after the visitor taps
 * "Allow" in the cookie banner. Everywhere else they're on by default with no
 * banner, and "Cookie settings" in the footer lets anyone switch them off.
 * An explicit choice always wins. Admin pages are never tracked.
 */
export function Analytics() {
  const pathname = usePathname() ?? "/";
  // "pending" until the browser has read the saved choice (and on the server).
  const saved = useSyncExternalStore(subscribeConsent, () => readConsent() ?? "unset", () => "pending" as const);
  const [reopened, setReopened] = useState(false);
  // Only needed when the visitor hasn't chosen yet: null until we know.
  const [optInRegion, setOptInRegion] = useState<boolean | null>(null);
  useEffect(() => {
    if (saved !== "unset" || optInRegion !== null) return;
    let live = true;
    fetchConsentRequired().then((required) => {
      if (live) setOptInRegion(required);
    });
    return () => {
      live = false;
    };
  }, [saved, optInRegion]);

  // No choice yet: opt-in regions see the banner ("unset"), others get tracking by default.
  const consent: Consent | "unset" | "pending" =
    saved !== "unset" ? saved : optInRegion === null ? "pending" : optInRegion ? "unset" : "granted";

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const bannerOpen = consent === "unset" || reopened;

  // The Meta snippet sends the first PageView itself; send one for each later in-app navigation.
  // (GA4 counts these on its own through enhanced measurement.)
  const firstPath = useRef(true);
  useEffect(() => {
    if (consent !== "granted") return;
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname, consent]);

  if (!trackingConfigured || consent === "pending" || pathname.startsWith("/admin")) return null;

  function choose(v: Consent) {
    saveConsent(v);
    // Turning tracking off after it loaded needs a fresh page so the scripts are gone.
    if (consent === "granted" && v === "denied") {
      window.location.reload();
      return;
    }
    setReopened(false);
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  }

  const googleTagId = GA_ID || ADS_ID;

  return (
    <>
      {consent === "granted" && googleTagId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} strategy="afterInteractive" />
          <Script id="google-tag" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());` +
              (GA_ID ? `gtag('config',${JSON.stringify(GA_ID)});` : "") +
              (ADS_ID ? `gtag('config',${JSON.stringify(ADS_ID)});` : "")}
          </Script>
        </>
      )}
      {consent === "granted" && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(META_PIXEL_ID)});fbq('track','PageView');`}
        </Script>
      )}

      {bannerOpen && (
        <div
          role="dialog"
          aria-label="Cookie choices"
          className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm z-50 rounded-2xl border border-rule bg-paper-raised text-ink shadow-[0_12px_40px_rgba(4,22,50,0.18)] p-5"
        >
          <p className="font-bold">Cookies on Lettr</p>
          <p className="mt-1.5 text-sm text-ink-soft">
            We&apos;d like to use Google and Meta cookies to see which ads and pages bring people to Lettr. They&apos;re off
            unless you allow them. See our{" "}
            <Link href="/privacy#storage" className="underline underline-offset-2 hover:text-brand-blue">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => choose("granted")}
              className="btn-press flex-1 min-h-11 rounded-full font-extrabold bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]"
            >
              Allow
            </button>
            <button
              type="button"
              onClick={() => choose("denied")}
              className="flex-1 min-h-11 rounded-full font-bold border border-rule bg-paper text-ink hover:border-ink"
            >
              No thanks
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link that reopens the cookie banner. Hidden when tracking isn't set up. */
export function CookieSettingsLink({ className = "" }: { className?: string }) {
  if (!trackingConfigured) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={className}>
      Cookie settings
    </button>
  );
}
