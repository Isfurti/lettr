import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TopNav } from "@/components/TopNav";
import { UseTemplateButton } from "@/components/UseTemplateButton";

const TEMPLATES = [
  {
    id: "classic",
    name: "The Classic",
    description: "Understated serif headings with hairline rules. ATS-friendly and easy to scan.",
    tags: ["ATS-friendly", "Traditional"],
  },
  {
    id: "modern",
    name: "The Modern",
    description: "A dark header band and left-accent section titles, with rounded skill chips.",
    tags: ["Visual", "Tech"],
  },
  {
    id: "compact",
    name: "The Compact",
    description: "Same clean structure as Classic, tightened up to fit more onto one page.",
    tags: ["Dense", "Experienced"],
  },
  {
    id: "bold",
    name: "The Bold",
    description: "Large uppercase name, heavy section blocks. Built to stand out at a glance.",
    tags: ["High-impact", "Leadership"],
  },
];

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initial = (session.user.name || session.user.email || "?")[0]?.toUpperCase();

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <TopNav active="templates" userInitial={initial} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-12">
        <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">Curated collection</p>
        <h1 className="font-display font-semibold text-4xl mb-3">The Templates</h1>
        <p className="text-ink-soft max-w-xl mb-10">
          Four layouts, each built around the same ATS-safe structure — pick the one that fits how you
          want to be read.
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
