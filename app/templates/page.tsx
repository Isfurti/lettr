import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { TopNav } from "@/components/TopNav";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { UseTemplateButton } from "@/components/UseTemplateButton";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import { TEMPLATE_IDS, isTemplateFree, type TemplateId } from "@/lib/templates";
import { getUserById } from "@/lib/db";
import type { Plan } from "@/lib/limits";

export const metadata: Metadata = {
  title: "Resume Templates | Lettr — 2 Free, 8 Pro",
  description:
    "10 ATS-friendly resume templates — 2 free (Classic, Modern), 8 more with Pro. Customize colors and fonts, then export to PDF or Word.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Resume Templates | Lettr",
    description: "10 ATS-friendly resume templates. 2 free to start, the rest with Pro.",
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
};

const TEMPLATES = TEMPLATE_IDS.map((id) => ({ id, ...TEMPLATE_META[id] }));

export default async function TemplatesPage() {
  const session = await auth();
  const initial = session?.user ? (session.user.name || session.user.email || "?")[0]?.toUpperCase() : undefined;

  let plan: Plan = "free";
  if (session?.user) {
    const user = await getUserById((session.user as { id: string }).id);
    plan = (user?.plan ?? "free") as Plan;
  }

  return (
    <div className="flex-1 flex flex-col bg-paper">
      {session?.user ? <TopNav active="templates" userInitial={initial} /> : <PublicNav />}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-12">
        <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Curated collection</p>
        <h1 className="font-display font-semibold text-4xl mb-3">Resume Templates</h1>
        <p className="text-ink-soft max-w-xl mb-10">
          10 layouts, all built around the same ATS-safe structure. <strong>Classic and Modern are
          free</strong> — the other 8 are part of Pro. You can preview any of them with your own content
          before deciding.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEMPLATES.map((t) => {
            const free = isTemplateFree(t.id);
            return (
              <div key={t.id} className="paper-sheet rounded-sm overflow-hidden flex flex-col relative">
                {!free && (
                  <span className="absolute top-2 right-2 z-10 text-[10px] font-mono uppercase bg-ink text-white px-1.5 py-0.5 rounded-sm">
                    Pro
                  </span>
                )}
                <div className="aspect-[3/4] bg-app-bg p-3 border-b border-rule">
                  <TemplateThumbnail id={t.id} />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-display font-semibold mb-1">{t.name}</p>
                  <p className="text-xs text-ink-soft mb-3 flex-1">{t.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[10px] uppercase tracking-wide bg-seal-soft text-seal-deep px-1.5 py-0.5 rounded-sm">
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
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
