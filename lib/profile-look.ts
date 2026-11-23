import { z } from "zod";

/** Banner styles the owner can pick. No uploads, so a banner can never carry a picture of anything. */
export const BANNER_STYLES = [
  { id: "navy-gold", label: "Navy and gold rings", bg: "#041632" },
  { id: "gold-sun", label: "Gold sun", bg: "#ffc94d" },
  { id: "blue-wave", label: "Blue waves", bg: "#2f5bea" },
  { id: "plain", label: "Plain navy", bg: "#041632" },
] as const;

export type BannerStyle = (typeof BANNER_STYLES)[number]["id"];

export const BANNER_IDS = BANNER_STYLES.map((b) => b.id) as [BannerStyle, ...BannerStyle[]];

export function bannerOf(v: unknown): BannerStyle {
  return BANNER_STYLES.some((b) => b.id === v) ? (v as BannerStyle) : "navy-gold";
}

/** Zero-width and text-direction characters: they can make text look different from what it says. */
export const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** Plain text only: no line breaks, no angle brackets, so these fields can never hold markup or a link. */
const text = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => s.replace(INVISIBLE, "").replace(/\s+/g, " ").trim())
    .refine((s) => !/[<>]/.test(s), "No angle brackets.");

export const ProfileLook = z.object({
  bannerStyle: z.enum(BANNER_IDS),
  pronouns: text(30),
  openToWork: z.boolean(),
  otwRole: text(60),
  otwPlace: text(60),
  otwNotice: text(40),
  showUpdated: z.boolean(),
});

export type ProfileLookInput = z.infer<typeof ProfileLook>;

/** "Open to work" line for the chip, e.g. "Data Analyst · Pune or remote · 30 days notice". Empty when switched off. */
export function openToWorkLine(p: { role: string; place: string; notice: string }): string {
  return [p.role, p.place, p.notice].filter(Boolean).join(" · ");
}

/** "2 days ago", "3 weeks ago", else the month and year. Server-side only, so it never differs between server and browser. */
export function updatedAgo(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const days = Math.floor((now.getTime() - t) / 86_400_000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(t).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
