/**
 * Ad and analytics tracking (Google Analytics 4, Google Ads, Meta Pixel).
 *
 * Nothing here loads until the visitor accepts cookies in the banner
 * (components/Analytics.tsx). Before that, or when an ID isn't set,
 * every call below quietly does nothing.
 *
 * IDs come from Vercel environment variables:
 *   NEXT_PUBLIC_GA_ID                     G-XXXXXXXXXX
 *   NEXT_PUBLIC_GOOGLE_ADS_ID             AW-XXXXXXXXXX
 *   NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL the label of the "Purchase" conversion action
 *   NEXT_PUBLIC_META_PIXEL_ID             numeric pixel ID
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
export const ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export const trackingConfigured = Boolean(GA_ID || ADS_ID || META_PIXEL_ID);

export type Consent = "granted" | "denied";
export const CONSENT_KEY = "lettr-cookie-consent";
/** Fired on window to reopen the cookie banner (from "Cookie settings" in the footer). */
export const OPEN_CONSENT_EVENT = "lettr:open-cookie-settings";

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(v: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // Private mode or blocked storage: the choice just lasts for this page view.
  }
}

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag(...args);
}
function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq(...args);
}

export function trackSignUp(method: "email" | "google" | "linkedin") {
  gtag("event", "sign_up", { method });
  fbq("track", "CompleteRegistration", { content_name: method });
}

export function trackAtsCheck(score?: number) {
  gtag("event", "ats_check", score === undefined ? {} : { score });
  fbq("trackCustom", "ATSCheck");
}

export function trackResumeDownload(fileType: "pdf" | "docx") {
  gtag("event", "resume_download", { file_type: fileType });
  fbq("trackCustom", "ResumeDownload", { file_type: fileType });
}

/**
 * A Pro pass was paid for. `amountMinor` is in the smallest unit (paise, cents),
 * as Razorpay returns it. Resolves after a short pause so the hits can leave
 * before the page navigates away.
 */
export async function trackPurchase(p: { transactionId: string; amountMinor: number; currency: string; plan: string }) {
  if (typeof window === "undefined" || (!window.gtag && !window.fbq)) return;
  const value = Math.round(p.amountMinor) / 100;
  const currency = p.currency.toUpperCase();
  gtag("event", "purchase", {
    transaction_id: p.transactionId,
    value,
    currency,
    items: [{ item_id: `pro_${p.plan}`, item_name: `Lettr Pro (${p.plan})`, price: value, quantity: 1 }],
  });
  if (ADS_ID && ADS_PURCHASE_LABEL) {
    gtag("event", "conversion", { send_to: `${ADS_ID}/${ADS_PURCHASE_LABEL}`, value, currency, transaction_id: p.transactionId });
  }
  fbq("track", "Purchase", { value, currency, content_ids: [`pro_${p.plan}`], content_type: "product" }, { eventID: p.transactionId });
  await new Promise((r) => setTimeout(r, 500));
}
