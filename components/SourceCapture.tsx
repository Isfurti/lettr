"use client";

import { useEffect, useRef } from "react";
import { readConsent } from "@/lib/analytics";
import { fetchConsentRequired, CONSENT_CHANGED_EVENT } from "@/components/Analytics";
import {
  SOURCE_COOKIE,
  SOURCE_COOKIE_MAX_AGE,
  classifyTouch,
  serializeSourceCookie,
  type SignupSource,
} from "@/lib/signup-source";

function hasCookie(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(SOURCE_COOKIE + "="));
}

function clearCookie() {
  document.cookie = `${SOURCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function writeCookie(s: SignupSource) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SOURCE_COOKIE}=${serializeSourceCookie(s)}; Max-Age=${SOURCE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Remembers, in one cookie for 30 days, which link or site first brought a
 * visitor here, so the sign-up can be tied to a channel (docs/changes/0005).
 * First visit wins; it never overwrites. Follows the same cookie choice as
 * Analytics: in the EU, UK and Switzerland only after "Allow", elsewhere on
 * unless the visitor switched tracking off. Admin pages are never recorded.
 * Renders nothing.
 */
export function SourceCapture() {
  // The first touch is worked out from the first page view and kept in memory
  // until consent allows writing it (the referrer is gone after the next click).
  const touch = useRef<SignupSource | null>(null);

  // Runs once for the life of the page (the root layout stays mounted across in-app navigation).
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    // Someone who switched tracking off must not keep an earlier source cookie.
    if (readConsent() === "denied") clearCookie();
    if (hasCookie()) return;

    touch.current = classifyTouch({
      href: window.location.href,
      referrer: document.referrer,
      ownHosts: [window.location.hostname, "getlettr.com"],
      now: new Date(),
    });

    let live = true;
    const tryWrite = async () => {
      if (!touch.current || hasCookie()) return;
      const saved = readConsent();
      if (saved === "denied") {
        clearCookie();
        return;
      }
      if (saved !== "granted" && (await fetchConsentRequired())) return; // opt-in region, no "Allow" yet
      if (!live || hasCookie() || !touch.current) return;
      writeCookie(touch.current);
      touch.current = null;
    };

    void tryWrite();
    window.addEventListener(CONSENT_CHANGED_EVENT, tryWrite);
    return () => {
      live = false;
      window.removeEventListener(CONSENT_CHANGED_EVENT, tryWrite);
    };
  }, []);

  return null;
}
