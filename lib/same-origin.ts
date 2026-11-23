import { siteUrl } from "./site-url";

/**
 * A second line of defence against forged cross-site requests, on top of the
 * session cookie's SameSite setting. Browsers always say where a request came
 * from, so: a request marked cross-site is refused, and so is one whose Origin
 * is neither this site nor the address it was sent to. Requests that carry
 * neither header (not a browser) pass, since a browser cannot send a
 * cross-site POST without one.
 */
export function isSameOriginRequest(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const o = new URL(origin).origin;
    return o === new URL(req.url).origin || o === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

/** Body must be sent as JSON, so a plain HTML form cannot post it. */
export function isJsonRequest(req: Request): boolean {
  return (req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}
