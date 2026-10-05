import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { UseTemplateButton } from "@/components/UseTemplateButton";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import { TEMPLATE_IDS, isTemplateFree, type TemplateId } from "@/lib/templates";
import { getUserById } from "@/lib/db";
import type { Plan } from "@/lib/limits";

export const metadata: Metadata = {
  title: "Resume Templates | Lettr — 16 Templates, 2 Free",
  description:
    "16 ATS-friendly resume templates — 2 free (Classic, Modern), 14 more with Pro. Customize colors and fonts, then export to PDF or Word.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Resume Templates | Lettr",
    description: "16 ATS-friendly resume templates. 2 free to start, the rest with Pro.",
    url: "/templates",
  },
};

// Typed as Record<TemplateId, ...> rather than a plain array - if a new
// template is ever added to TEMPLATE_IDS without adding its metadata here
// (or vice versa), this is a compile error, not a silent runtime gap. This
// is exactly the class of bug that let the admin templates page drift 6
// templates out of date before.
const TEMPLATE_META: Record<TemplateId, { name: string; description: string; tags: string[] }> = {
  classic: { name: "The Classic", description: "Understated serif headings with hairline rules. ATS-friendly and easy to scan.", tags: ["ATS-friendly", "Traditional"] },
  modern: { name: "The Modern", description: "A dark header band and left-accent section titles, with rounded skill chips.", tags: ["Visual", "Tech"] },
  compact: { name: "The Compact", description: "Same clean structure as Classic, tightened up to fit more onto one page.", tags: ["Dense", "Experienced"] },
  bold: { name: "The Bold", description: "Large uppercase name, heavy section blocks. Built to stand out at a glance.", tags: ["High-impact", "Leadership"] },
  sidebar: { name: "The Sidebar", description: "Two-column layout with a colored contact/skills rail down the side.", tags: ["Two-column", "Design-forward"] },
  minimal: { name: "The Minimal", description: "Zero color, pure typographic hierarchy. Built for maximum ATS-parser safety.", tags: ["ATS-friendly", "Understated"] },
  executive: { name: "The Executive", description: "Centered layout, generous whitespace, a refined serif name.", tags: ["Premium", "Senior roles"] },
  technical: { name: "The Technical", description: "Monospace accents and a code-inspired structure, built for engineers.", tags: ["Tech", "Engineering"] },
  timeline: { name: "The Timeline", description: "A connecting line down the left visually links each role in sequence.", tags: ["Visual", "Career growth"] },
  elegant: { name: "The Elegant", description: "Thin hairline dividers and italic role titles for an editorial feel.", tags: ["Editorial", "Understated"] },
  ribbon: { name: "The Ribbon", description: "A bold accent ribbon beside your name and pill-shaped section labels.", tags: ["Visual", "Friendly"] },
  split: { name: "The Split", description: "Your story on the left; contact, skills and education in a tinted column on the right.", tags: ["Two-column", "Tidy"] },
  scholar: { name: "The Scholar", description: "Centred and calm, with education first. Made for academic and research roles.", tags: ["Academic", "Traditional"] },
  fresher: { name: "The Fresher", description: "Education, projects and skills come first, so students and freshers lead with their strengths.", tags: ["Students", "Campus placements"] },
  grid: { name: "The Grid", description: "Section names in a neat left column with your content beside them. Clean and structured.", tags: ["Structured", "Modern"] },
  spotlight: { name: "The Spotlight", description: "A tinted header card with your initials and your summary called out up top.", tags: ["Visual", "Personal brand"] },
};

const TEMPLATES = TEMPLATE_IDS.map((id) => ({ id, ...TEMPLATE_META[id] }));

export default async function TemplatesPage() {
  const session = await auth();

  let plan: Plan = "free";
  if (session?.user) {
    const user = await getUserById((session.user as { id: string }).id);
    plan = (user?.plan ?? "free") as Plan;
  }

  const freeCount = TEMPLATES.filter((t) => isTemplateFree(t.id)).length;

  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-10 sm:py-16">
        <div className="max-w-2xl mb-12 rise">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-blue mb-3">Templates</p>
          <h1 className="font-brand font-extrabold text-[40px] sm:text-[56px] leading-[1.02] tracking-tight">
            Look the part. Pick a template.
          </h1>
          <p className="mt-5 text-lg text-slate leading-relaxed">
            {TEMPLATES.length} layouts, all built on the same structure hiring software can read.{" "}
            <strong className="text-ink">Classic and Modern are free</strong>; the other {TEMPLATES.length - freeCount} come
            with Pro. Try any of them with your own details before you decide.
          </p>
        </div>

        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {TEMPLATES.map((t) => {
            const free = isTemplateFree(t.id);
            return (
              <div key={t.id} className="flex flex-col">
                <div className="lift relative bg-white rounded-2xl border border-rule p-3 shadow-[0_10px_24px_rgba(4,22,50,0.08)]">
                  <span
                    className={`absolute -top-3 left-3 z-10 text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      free ? "bg-gold text-ink" : "bg-ink text-gold"
                    }`}
                  >
                    {free ? "Free" : "Pro"}
                  </span>
                  <div className="aspect-[1/1.25] rounded-md overflow-hidden">
                    <TemplateThumbnail id={t.id} renderWidth={560} />
                  </div>
                </div>
                <p className="mt-4 font-brand font-extrabold text-xl">{t.name}</p>
                <p className="mt-1 text-slate leading-relaxed flex-1">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-xs font-bold bg-brand-blue-soft text-brand-blue-deep px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <UseTemplateButton
                  template={t.id}
                  label={free || plan === "pro" ? "Use this template" : "Try this template"}
                  isLoggedIn={Boolean(session?.user)}
                  locked={Boolean(session?.user) && plan === "free" && !free}
                />
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
