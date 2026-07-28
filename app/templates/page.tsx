import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { TopNav } from "@/components/TopNav";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { UseTemplateButton } from "@/components/UseTemplateButton";

export const metadata: Metadata = {
  title: "Free ATS-Friendly Resume Templates | Lettr",
  description:
    "10 free, ATS-friendly resume templates — Classic, Modern, Sidebar, Executive, and more. Customize colors and fonts, then export to PDF or Word.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Free ATS-Friendly Resume Templates | Lettr",
    description: "10 free, ATS-friendly resume templates. Customize colors and fonts, export to PDF or Word.",
    url: "/templates",
  },
};

const TEMPLATES = [
  { id: "classic", name: "The Classic", description: "Understated serif headings with hairline rules. ATS-friendly and easy to scan.", tags: ["ATS-friendly", "Traditional"] },
  { id: "modern", name: "The Modern", description: "A dark header band and left-accent section titles, with rounded skill chips.", tags: ["Visual", "Tech"] },
  { id: "compact", name: "The Compact", description: "Same clean structure as Classic, tightened up to fit more onto one page.", tags: ["Dense", "Experienced"] },
  { id: "bold", name: "The Bold", description: "Large uppercase name, heavy section blocks. Built to stand out at a glance.", tags: ["High-impact", "Leadership"] },
  { id: "sidebar", name: "The Sidebar", description: "Two-column layout with a colored contact/skills rail down the side.", tags: ["Two-column", "Design-forward"] },
  { id: "minimal", name: "The Minimal", description: "Zero color, pure typographic hierarchy. Built for maximum ATS-parser safety.", tags: ["ATS-friendly", "Understated"] },
  { id: "executive", name: "The Executive", description: "Centered layout, generous whitespace, a refined serif name.", tags: ["Premium", "Senior roles"] },
  { id: "technical", name: "The Technical", description: "Monospace accents and a code-inspired structure, built for engineers.", tags: ["Tech", "Engineering"] },
  { id: "timeline", name: "The Timeline", description: "A connecting line down the left visually links each role in sequence.", tags: ["Visual", "Career growth"] },
  { id: "elegant", name: "The Elegant", description: "Thin hairline dividers and italic role titles for an editorial feel.", tags: ["Editorial", "Understated"] },
];

export default async function TemplatesPage() {
  const session = await auth();
  const initial = session?.user ? (session.user.name || session.user.email || "?")[0]?.toUpperCase() : undefined;

  return (
    <div className="flex-1 flex flex-col bg-paper">
      {session?.user ? <TopNav active="templates" userInitial={initial} /> : <PublicNav />}

      <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-12">
        <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Curated collection</p>
        <h1 className="font-display font-semibold text-4xl mb-3">Free Resume Templates</h1>
        <p className="text-ink-soft max-w-xl mb-10">
          10 layouts, each built around the same ATS-safe structure. Pick one, customize the color
          and font, and export to PDF or Word — free to start.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="paper-sheet rounded-sm overflow-hidden flex flex-col">
              <div className="aspect-[3/4] bg-app-bg p-3">
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
                <UseTemplateButton template={t.id} />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TemplateThumbnail({ id }: { id: string }) {
  if (id === "modern") {
    return (
      <div className="w-full h-full bg-white rounded-sm overflow-hidden text-[6px]">
        <div className="bg-ink px-2 py-2">
          <div className="h-1.5 w-2/3 bg-white/90 rounded-sm mb-1" />
          <div className="h-1 w-1/2 bg-white/50 rounded-sm" />
        </div>
        <div className="p-2 space-y-1">
          <div className="h-1 w-1/3 bg-seal rounded-sm" />
          <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
          <div className="h-0.5 w-4/5 bg-ink-soft/20 rounded-sm" />
          <div className="h-1 w-1/3 bg-seal rounded-sm mt-1.5" />
          <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
        </div>
      </div>
    );
  }
  if (id === "bold") {
    return (
      <div className="w-full h-full bg-white rounded-sm p-2 text-[6px]">
        <div className="h-2 w-3/4 bg-ink rounded-sm mb-0.5" />
        <div className="h-0.5 w-8 bg-seal rounded-sm mb-1.5" />
        <div className="h-1 w-1/4 bg-ink rounded-sm mb-1" />
        <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
        <div className="h-0.5 w-4/5 bg-ink-soft/20 rounded-sm mb-1" />
        <div className="h-1 w-1/4 bg-ink rounded-sm mb-1" />
        <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
      </div>
    );
  }
  if (id === "sidebar") {
    return (
      <div className="w-full h-full bg-white rounded-sm overflow-hidden text-[6px] flex">
        <div className="w-1/3 bg-seal p-1.5 space-y-1">
          <div className="h-1.5 w-full bg-white/90 rounded-sm mb-1" />
          <div className="h-0.5 w-full bg-white/40 rounded-sm" />
          <div className="h-0.5 w-full bg-white/40 rounded-sm" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          <div className="h-1 w-1/2 bg-seal rounded-sm" />
          <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
          <div className="h-0.5 w-4/5 bg-ink-soft/20 rounded-sm" />
        </div>
      </div>
    );
  }
  if (id === "minimal") {
    return (
      <div className="w-full h-full bg-white rounded-sm p-2 space-y-1 text-[6px]">
        <div className="h-1.5 w-2/3 bg-black rounded-sm mb-1" />
        <div className="h-0.5 w-1/4 bg-black rounded-sm" />
        <div className="h-0.5 w-full bg-black/20 rounded-sm" />
        <div className="h-0.5 w-4/5 bg-black/20 rounded-sm" />
      </div>
    );
  }
  if (id === "executive") {
    return (
      <div className="w-full h-full bg-white rounded-sm p-2 space-y-1 text-[6px] flex flex-col items-center">
        <div className="h-1.5 w-1/2 bg-ink rounded-sm mb-0.5" />
        <div className="h-px w-1/4 bg-seal mb-1" />
        <div className="h-0.5 w-3/4 bg-ink-soft/20 rounded-sm" />
        <div className="h-0.5 w-2/3 bg-ink-soft/20 rounded-sm" />
      </div>
    );
  }
  if (id === "technical") {
    return (
      <div className="w-full h-full bg-white rounded-sm p-2 space-y-1 text-[6px] font-mono">
        <div className="h-1.5 w-2/3 bg-ink rounded-sm mb-1" />
        <div className="h-0.5 w-1/3 bg-seal rounded-sm" />
        <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm border-l-2 border-seal pl-1" />
        <div className="h-0.5 w-4/5 bg-ink-soft/20 rounded-sm border-l-2 border-seal pl-1" />
      </div>
    );
  }
  if (id === "timeline") {
    return (
      <div className="w-full h-full bg-white rounded-sm p-2 space-y-2 text-[6px]">
        <div className="h-1.5 w-2/3 bg-ink rounded-sm mb-1" />
        <div className="flex gap-1 items-start">
          <div className="w-1 h-1 rounded-full bg-seal mt-0.5 shrink-0" />
          <div className="flex-1 space-y-0.5">
            <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
            <div className="h-0.5 w-4/5 bg-ink-soft/20 rounded-sm" />
          </div>
        </div>
        <div className="flex gap-1 items-start">
          <div className="w-1 h-1 rounded-full bg-seal mt-0.5 shrink-0" />
          <div className="flex-1 space-y-0.5">
            <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "elegant") {
    return (
      <div className="w-full h-full bg-white rounded-sm p-2 space-y-1 text-[6px]">
        <div className="h-1.5 w-1/2 bg-ink rounded-sm mb-0.5" />
        <div className="h-px w-full bg-rule mb-1" />
        <div className="h-0.5 w-1/3 bg-seal rounded-sm" />
        <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm italic" />
      </div>
    );
  }
  const dense = id === "compact";
  return (
    <div className={`w-full h-full bg-white rounded-sm p-2 text-[6px] ${dense ? "space-y-0.5" : "space-y-1"}`}>
      <div className="h-1.5 w-2/3 bg-ink rounded-sm mb-0.5" />
      <div className="h-0.5 w-1/2 bg-ink-soft/40 rounded-sm mb-1.5" />
      <div className="h-0.5 w-1/4 bg-seal rounded-sm" />
      <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
      <div className="h-0.5 w-4/5 bg-ink-soft/20 rounded-sm mb-1" />
      <div className="h-0.5 w-1/4 bg-seal rounded-sm" />
      <div className="h-0.5 w-full bg-ink-soft/20 rounded-sm" />
      <div className="h-0.5 w-3/5 bg-ink-soft/20 rounded-sm" />
    </div>
  );
}
