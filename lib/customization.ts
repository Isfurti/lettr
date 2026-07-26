export const ACCENT_COLORS = [
  { id: "gold", label: "Gold", hex: "#b8862e" }, // default, matches app brand
  { id: "navy", label: "Navy", hex: "#1e3a5f" },
  { id: "forest", label: "Forest", hex: "#2d5741" },
  { id: "burgundy", label: "Burgundy", hex: "#7a2e3a" },
  { id: "slate", label: "Slate", hex: "#4a5568" },
  { id: "rust", label: "Rust", hex: "#b5502e" },
  { id: "teal", label: "Teal", hex: "#1f6f6f" },
  { id: "plum", label: "Plum", hex: "#5d3a7a" },
] as const;

export const DEFAULT_ACCENT_COLOR = ACCENT_COLORS[0].hex;

export const FONT_PAIRS = [
  {
    id: "editorial",
    label: "Editorial",
    display: "'Source Serif 4', Georgia, serif",
    body: "'Manrope', -apple-system, sans-serif",
  },
  {
    id: "elegant",
    label: "Elegant",
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
  },
  {
    id: "classic",
    label: "Classic",
    display: "Georgia, 'Times New Roman', serif",
    body: "Arial, Helvetica, sans-serif",
  },
] as const;

export type FontPairId = (typeof FONT_PAIRS)[number]["id"];

export function getFontPair(id?: string) {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];
}

/** Darkens a hex color by a percentage, for the "deep" variant used in text-on-light contexts. */
export function darkenHex(hex: string, amount = 0.25): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Lightens a hex color toward a soft tint, for chip/badge backgrounds. */
export function softenHex(hex: string, amount = 0.85): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.floor(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount);
  const g = Math.floor(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount);
  const b = Math.floor((num & 0xff) + (255 - (num & 0xff)) * amount);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
