import { requireAdmin } from "@/lib/admin-auth";
import { getTemplatePopularity } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";

const ALL_TEMPLATES = ["classic", "modern", "compact", "bold"];

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const popularity = await getTemplatePopularity();
  const total = popularity.reduce((sum, p) => sum + p.count, 0);
  const countByTemplate = new Map(popularity.map((p) => [p.template, p.count]));
  const maxCount = Math.max(1, ...popularity.map((p) => p.count));

  return (
    <div className="flex-1 flex admin-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-6xl">
        <h1 className="font-display font-semibold text-3xl mb-1">Templates</h1>
        <p className="text-ink-soft mb-8">Real usage across {total} resume{total === 1 ? "" : "s"}.</p>

        <div className="paper-sheet rounded-sm p-6">
          {total === 0 ? (
            <p className="text-sm text-ink-soft">No resumes created yet.</p>
          ) : (
            <div className="space-y-5">
              {ALL_TEMPLATES.map((t) => {
                const count = countByTemplate.get(t) ?? 0;
                const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                return (
                  <div key={t}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm capitalize">{t}</span>
                      <span className="text-xs text-ink-soft font-mono">{count} resumes · {pct}%</span>
                    </div>
                    <div className="h-2 bg-app-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-admin-accent rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
