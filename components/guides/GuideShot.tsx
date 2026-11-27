import Image from "next/image";

type Shot = { src: string; w: number; h: number; alt: string; caption: string };

const SAMPLE = "Sample made-up resume shown in Lettr.";

const SHOTS: Record<string, Shot> = {
  score: { src: "/guides/score.webp", w: 1400, h: 853, alt: "Lettr Resume Score screen showing a score of 90 with section scores and a resume preview", caption: "The Score tab in Lettr, with a sample resume." },
  resignation: { src: "/features/resignation.webp", w: 1400, h: 1105, alt: "Lettr resignation letter tab with name, job title, company, last working day, tone and letter designs", caption: "The resignation letter writer in Lettr." },
  fresher: { src: "/guides/resume-fresher.webp", w: 900, h: 1223, alt: "Sample fresher resume for a campus placement software engineer", caption: SAMPLE },
  usa: { src: "/guides/resume-usa.webp", w: 900, h: 1100, alt: "Sample US resume for a customer service representative", caption: SAMPLE },
  uk: { src: "/guides/resume-uk.webp", w: 900, h: 994, alt: "Sample UK graduate CV", caption: "Sample made-up CV shown in Lettr." },
  law: { src: "/guides/resume-law.webp", w: 900, h: 1223, alt: "Sample resume for a law graduate", caption: SAMPLE },
  exp: { src: "/guides/resume-exp.webp", w: 900, h: 1223, alt: "Sample resume for an experienced product manager", caption: SAMPLE },
};

function shotFor(slug: string): Shot | null {
  const w = new Set(slug.split("-"));
  const has = (...k: string[]) => k.some((x) => w.has(x));
  if (has("resignation")) return SHOTS.resignation;
  if (has("cover")) return null; // no cover letter screenshot yet
  if (has("ats", "naukri", "checklist", "requirements")) return SHOTS.score;
  if (has("uk", "nhs")) return SHOTS.uk;
  if (has("usa", "builder")) return SHOTS.usa;
  if (has("law", "llb", "moot", "legal")) return SHOTS.law;
  if (has("experienced", "experience", "years", "gap")) return SHOTS.exp;
  return SHOTS.fresher;
}

export function GuideShot({ slug }: { slug: string }) {
  const s = shotFor(slug);
  if (!s) return null;
  const wide = s.w >= 1000;
  return (
    <figure className={`mt-8 ${wide ? "" : "max-w-md"}`}>
      <Image src={s.src} width={s.w} height={s.h} alt={s.alt} sizes="(min-width: 768px) 672px, 100vw" className="w-full h-auto rounded-2xl border-2 border-rule bg-white" />
      <figcaption className="mt-2 text-sm text-slate">{s.caption}</figcaption>
    </figure>
  );
}
