/**
 * Where a sign-up came from: the first page a visitor landed on, reduced to a
 * channel plus a few safe labels. Pure functions only, so the browser (which
 * builds it) and the server (which re-checks it before saving) share one
 * definition. See docs/changes/0005-signup-source.md.
 *
 * Deliberately not kept: the raw click ID (gclid, fbclid), the full referrer
 * URL, any query string, the IP address.
 */

export const SOURCE_COOKIE = "lettr_src";
export const SOURCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const MAX_COOKIE_CHARS = 600;

export const CHANNELS = [
  "google_ads",
  "meta_ads",
  "paid_other",
  "organic_search",
  "social",
  "email",
  "referral",
  "direct",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel | "not_recorded", string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta ads",
  paid_other: "Other paid",
  organic_search: "Search (not paid)",
  social: "Social",
  email: "Email",
  referral: "Other website",
  direct: "Direct / unknown",
  not_recorded: "Not recorded",
};

export type SignupSource = {
  channel: Channel;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_path: string | null;
  /** YYYY-MM-DD of the first visit. */
  first_seen: string | null;
  /** True when the visit carried an ad click ID. The ID itself is not kept. */
  paid_click: boolean;
};

const SEARCH_HOSTS = [
  "google.", "bing.com", "duckduckgo.com", "yahoo.", "ecosia.org", "baidu.com", "yandex.", "search.brave.com", "startpage.com",
];
const SOCIAL_HOSTS = [
  "reddit.com", "linkedin.com", "lnkd.in", "facebook.com", "fb.com", "instagram.com", "t.co", "x.com", "twitter.com",
  "youtube.com", "youtu.be", "whatsapp.com", "wa.me", "t.me", "telegram.org", "quora.com", "pinterest.", "threads.net", "discord.com",
];
const EMAIL_HOSTS = ["mail.google.com", "outlook.live.com", "outlook.office.com", "mail.yahoo.com"];
const SOCIAL_NAMES = new Set([
  "reddit", "linkedin", "facebook", "fb", "instagram", "ig", "twitter", "x", "youtube", "whatsapp", "telegram", "quora", "pinterest", "threads", "discord",
]);
const SEARCH_NAMES = new Set(["google", "bing", "duckduckgo", "yahoo", "ecosia", "brave"]);
const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsearch", "paid_search", "paid-search", "paidsocial", "paid_social", "paid-social", "display", "cpm"]);

function hostMatches(host: string, list: string[]): boolean {
  return list.some((h) => (h.endsWith(".") ? host.startsWith(h) || host.includes("." + h) : host === h || host.endsWith("." + h)));
}

/** Lower-cased, trimmed, safe label: letters, digits and a few separators only. */
function label(v: string | null | undefined, max = 60): string | null {
  if (!v) return null;
  const s = v.trim().toLowerCase().slice(0, max);
  return /^[a-z0-9][a-z0-9 _.\-+]*$/.test(s) ? s : null;
}

function cleanHost(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim().toLowerCase().replace(/^www\./, "");
  return /^[a-z0-9][a-z0-9.\-]{0,99}$/.test(s) && s.includes(".") ? s : null;
}

function cleanPath(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.split(/[?#]/)[0].slice(0, 80);
  return /^\/[A-Za-z0-9/_\-.]*$/.test(s) ? s : null;
}

function cleanDate(v: string | null | undefined): string | null {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export type TouchInput = {
  /** Full URL of the landing page (location.href). */
  href: string;
  /** document.referrer (may be empty). */
  referrer: string;
  /** Hosts that are Lettr itself: a referrer from these is not a source. */
  ownHosts: string[];
  now: Date;
};

/**
 * Reduces a landing page view to a SignupSource. Never throws; a URL it cannot
 * read gives a "direct" touch with no labels.
 */
export function classifyTouch(input: TouchInput): SignupSource {
  let params = new URLSearchParams();
  let path: string | null = null;
  try {
    const u = new URL(input.href);
    params = u.searchParams;
    path = cleanPath(u.pathname);
  } catch {
    // unreadable URL: fall through as direct
  }

  let refHost: string | null = null;
  try {
    if (input.referrer) refHost = cleanHost(new URL(input.referrer).hostname);
  } catch {
    refHost = null;
  }
  const own = input.ownHosts.map((h) => h.replace(/^www\./, "").toLowerCase());
  if (refHost && own.some((h) => refHost === h || refHost!.endsWith("." + h))) refHost = null;

  const utmSource = label(params.get("utm_source"), 40);
  const utmMedium = label(params.get("utm_medium"), 40);
  const utmCampaign = label(params.get("utm_campaign"), 60);
  const googleClick = Boolean(params.get("gclid") || params.get("gbraid") || params.get("wbraid"));
  const metaClick = Boolean(params.get("fbclid"));
  const paidMedium = utmMedium ? PAID_MEDIUMS.has(utmMedium) : false;

  const fields = {
    referrer_host: refHost,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    landing_path: path,
    first_seen: input.now.toISOString().slice(0, 10),
    // A Facebook click ID alone is also on ordinary shared links, so it is not "paid".
    paid_click: googleClick || (metaClick && paidMedium),
  };
  return { channel: deriveChannel(fields), ...fields };
}

/**
 * The channel is worked out here, on the server, from the raw fields, and is
 * never read from the cookie, so a visitor cannot write "google_ads" into it.
 */
export function deriveChannel(f: Pick<SignupSource, "referrer_host" | "utm_source" | "utm_medium" | "paid_click">): Channel {
  const { utm_source: utmSource, utm_medium: utmMedium, referrer_host: refHost } = f;
  const paidMedium = utmMedium ? PAID_MEDIUMS.has(utmMedium) : false;
  const sourceIsGoogle = utmSource === "google";
  const sourceIsMeta = utmSource ? ["facebook", "fb", "instagram", "ig", "meta"].includes(utmSource) : false;

  if (f.paid_click) return sourceIsMeta ? "meta_ads" : "google_ads";
  if (paidMedium && sourceIsGoogle) return "google_ads";
  if (paidMedium && sourceIsMeta) return "meta_ads";
  if (paidMedium) return "paid_other";
  if (utmMedium === "email" || utmMedium === "newsletter" || utmSource === "email" || utmSource === "newsletter") return "email";
  if (utmSource && SEARCH_NAMES.has(utmSource)) return "organic_search";
  if (utmSource && SOCIAL_NAMES.has(utmSource)) return "social";
  if (utmSource) return "referral";
  if (refHost && hostMatches(refHost, EMAIL_HOSTS)) return "email";
  if (refHost && hostMatches(refHost, SEARCH_HOSTS)) return "organic_search";
  if (refHost && hostMatches(refHost, SOCIAL_HOSTS)) return "social";
  if (refHost) return "referral";
  return "direct";
}

/** What the browser stores: the raw fields only, no channel. */
export function serializeSourceCookie(s: SignupSource): string {
  const { channel: _channel, ...raw } = s;
  void _channel;
  return encodeURIComponent(JSON.stringify(raw));
}

/**
 * Reads the cookie value back into a SignupSource, or null. The cookie is set
 * in the browser so it is untrusted input. `raw` is the value as Next gives it
 * (already URL-decoded once), so it is parsed as JSON directly. The channel is
 * recomputed here. Bad single fields are dropped; if nothing valid is left the
 * result is null.
 */
export function parseSourceCookie(raw: string | null | undefined, now: Date = new Date()): SignupSource | null {
  if (!raw || raw.length > MAX_COOKIE_CHARS) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const o = obj as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : null);

  let firstSeen = cleanDate(str("first_seen"));
  if (firstSeen) {
    const t = Date.parse(firstSeen + "T00:00:00Z");
    const ageDays = (now.getTime() - t) / 86_400_000;
    if (!Number.isFinite(t) || ageDays < -1 || ageDays > 31) firstSeen = null;
  }
  const fields = {
    referrer_host: cleanHost(str("referrer_host")),
    utm_source: label(str("utm_source"), 40),
    utm_medium: label(str("utm_medium"), 40),
    utm_campaign: label(str("utm_campaign"), 60),
    landing_path: cleanPath(str("landing_path")),
    first_seen: firstSeen,
    paid_click: o.paid_click === true,
  };
  const empty =
    !fields.referrer_host && !fields.utm_source && !fields.utm_medium && !fields.utm_campaign && !fields.landing_path && !fields.first_seen && !fields.paid_click;
  if (empty) return null;
  return { channel: deriveChannel(fields), ...fields };
}
