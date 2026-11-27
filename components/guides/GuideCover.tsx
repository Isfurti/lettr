// Decorative cover art for guides, drawn in the Lettr brand colours.
// One motif per topic, picked from the guide slug. No text inside, so it never repeats the title.
const NAVY = "#041632";
const GOLD = "#ffc94d";
const GOLD_DEEP = "#e0a800";
const BLUE = "#2f5bea";
const CREAM = "#fffdf8";

type Motif = "resume" | "checklist" | "letter" | "law" | "score" | "timeline";

function motifFor(slug: string): Motif {
  const w = new Set(slug.split("-"));
  const has = (...k: string[]) => k.some((x) => w.has(x));
  if (has("law", "llb", "moot", "legal")) return "law";
  if (has("checklist", "requirements")) return "checklist";
  if (has("cover", "resignation")) return "letter";
  if (has("ats", "naukri")) return "score";
  if (has("gap", "experience", "years")) return "timeline";
  return "resume";
}

// Neighbouring guides share a motif, so rotate the background a little to keep cards distinct.
const ALT_BG = [NAVY, BLUE, "#0b2a5c"];
function bgFor(slug: string, m: Motif) {
  if (m !== "law") return BG[m];
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ALT_BG[h % ALT_BG.length];
}

const BG: Record<Motif, string> = {
  resume: BLUE,
  checklist: NAVY,
  letter: GOLD,
  law: NAVY,
  score: BLUE,
  timeline: GOLD,
};

function Lines({ x, y, w, n, color }: { x: number; y: number; w: number; n: number; color: string }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x} y={y + i * 18} width={i % 3 === 2 ? w * 0.6 : w} height={8} rx={4} fill={color} opacity={0.55} />
      ))}
    </>
  );
}

export function GuideCover({ slug, className = "" }: { slug: string; className?: string }) {
  const m = motifFor(slug);
  return (
    <svg
      viewBox="0 0 640 360"
      aria-hidden="true"
      className={`block w-full h-auto ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="640" height="360" fill={bgFor(slug, m)} />
      <circle cx="560" cy="40" r="110" fill={m === "letter" || m === "timeline" ? GOLD_DEEP : GOLD} opacity={0.35} />
      <circle cx="70" cy="330" r="90" fill={CREAM} opacity={0.1} />

      {m === "resume" && (
        <g>
          <rect x="215" y="40" width="210" height="280" rx="14" fill={CREAM} />
          <rect x="235" y="62" width="60" height="60" rx="30" fill={GOLD} />
          <rect x="310" y="68" width="95" height="12" rx="6" fill={NAVY} />
          <rect x="310" y="90" width="70" height="8" rx="4" fill={BLUE} opacity={0.7} />
          <Lines x={235} y={146} w={170} n={8} color={NAVY} />
        </g>
      )}

      {m === "checklist" && (
        <g>
          <rect x="190" y="40" width="260" height="280" rx="16" fill={CREAM} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x="215" y={72 + i * 62} width="34" height="34" rx="9" fill={i < 3 ? GOLD : "none"} stroke={NAVY} strokeWidth="3" />
              {i < 3 && <path d={`M224 ${89 + i * 62} l7 7 l12 -14`} stroke={NAVY} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              <rect x="265" y={80 + i * 62} width={150 - i * 12} height="10" rx="5" fill={NAVY} opacity={0.55} />
              <rect x="265" y={98 + i * 62} width="90" height="8" rx="4" fill={NAVY} opacity={0.25} />
            </g>
          ))}
        </g>
      )}

      {m === "letter" && (
        <g>
          <rect x="175" y="70" width="290" height="230" rx="16" fill={CREAM} />
          <path d="M175 86 L320 200 L465 86" stroke={NAVY} strokeWidth="5" fill="none" strokeLinejoin="round" />
          <rect x="215" y="215" width="120" height="10" rx="5" fill={NAVY} opacity={0.5} />
          <rect x="215" y="237" width="200" height="10" rx="5" fill={NAVY} opacity={0.3} />
          <circle cx="425" cy="250" r="22" fill={BLUE} />
        </g>
      )}

      {m === "law" && (
        <g>
          <rect x="308" y="70" width="24" height="200" rx="6" fill={GOLD} />
          <rect x="250" y="262" width="140" height="22" rx="8" fill={GOLD} />
          <rect x="170" y="86" width="300" height="12" rx="6" fill={GOLD} />
          <path d="M190 98 L150 190 H230 Z" fill={CREAM} />
          <path d="M450 98 L410 190 H490 Z" fill={CREAM} />
          <path d="M150 190 a40 18 0 0 0 80 0 Z" fill={CREAM} />
          <path d="M410 190 a40 18 0 0 0 80 0 Z" fill={CREAM} />
          <circle cx="320" cy="70" r="14" fill={GOLD} />
        </g>
      )}

      {m === "score" && (
        <g>
          <rect x="130" y="50" width="190" height="260" rx="14" fill={CREAM} />
          <rect x="150" y="72" width="100" height="12" rx="6" fill={NAVY} />
          <Lines x={150} y={104} w={150} n={9} color={NAVY} />
          <circle cx="440" cy="180" r="88" fill={CREAM} />
          <circle cx="440" cy="180" r="66" fill="none" stroke={NAVY} strokeOpacity={0.12} strokeWidth="20" />
          <circle
            cx="440"
            cy="180"
            r="66"
            fill="none"
            stroke={GOLD_DEEP}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray="330 415"
            transform="rotate(-90 440 180)"
          />
          <path d="M412 182 l20 20 l38 -42" stroke={NAVY} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {m === "timeline" && (
        <g>
          <rect x="318" y="50" width="6" height="260" rx="3" fill={NAVY} opacity={0.35} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx="321" cy={90 + i * 90} r="16" fill={i === 1 ? BLUE : NAVY} />
              <rect
                x={i % 2 ? 90 : 360}
                y={68 + i * 90}
                width="190"
                height="44"
                rx="12"
                fill={CREAM}
              />
              <rect x={(i % 2 ? 90 : 360) + 18} y={84 + i * 90} width="110" height="10" rx="5" fill={NAVY} opacity={0.55} />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
