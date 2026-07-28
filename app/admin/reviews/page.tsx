import { requireAdmin } from "@/lib/admin-auth";
import { listAllReviews, getReviewStats } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminReviewsPage() {
  await requireAdmin();
  const [reviews, stats] = await Promise.all([listAllReviews(200), getReviewStats()]);

  // Flatten every dislike across every review into one list, most recent
  // first - this is the actual "what don't they like" view, not just a
  // pile of raw reviews to read one by one.
  const painPoints = reviews
    .flatMap((r) =>
      r.dislikes.map((d) => ({
        text: d,
        reviewId: r.id,
        rating: r.rating,
        userEmail: r.user_email,
        createdAt: r.created_at,
      }))
    );

  const sentimentColor: Record<string, string> = {
    positive: "bg-admin-accent-soft text-admin-accent-deep",
    negative: "bg-red-100 text-red-700",
    mixed: "bg-yellow-100 text-yellow-800",
    neutral: "bg-rule/40 text-ink-soft",
  };

  return (
    <div className="flex-1 flex admin-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <h1 className="font-display font-semibold text-3xl mb-1">Reviews</h1>
        <p className="text-ink-soft mb-8">Real feedback, analyzed for what people actually like and don't.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-admin-accent">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">Total reviews</p>
            <p className="font-display font-semibold text-2xl">{stats.total}</p>
          </div>
          <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-admin-accent">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">Average rating</p>
            <p className="font-display font-semibold text-2xl">{stats.avgRating || "—"} <span className="text-sm text-ink-soft">/ 5</span></p>
          </div>
          <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-admin-accent">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">Distribution</p>
            <div className="flex items-end gap-1 h-8 mt-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const count = stats.distribution[star] ?? 0;
                const max = Math.max(1, ...Object.values(stats.distribution));
                return (
                  <div key={star} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full bg-admin-accent rounded-t-sm" style={{ height: `${(count / max) * 24}px` }} />
                    <span className="text-[9px] text-ink-soft">{star}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">What users don&apos;t like ({painPoints.length})</h2>
        <div className="paper-sheet rounded-sm overflow-hidden mb-10">
          {painPoints.length === 0 ? (
            <p className="text-sm text-ink-soft px-6 py-6">No dislikes recorded yet — nothing negative has come up in reviews so far.</p>
          ) : (
            painPoints.map((p, i) => (
              <div key={i} className="flex items-start justify-between px-6 py-3 border-b border-rule last:border-b-0 gap-4">
                <p className="text-sm">{p.text}</p>
                <div className="text-right shrink-0">
                  <p className="text-xs text-ink-soft">{p.userEmail} · {p.rating}★</p>
                  <p className="text-[10px] text-ink-soft font-mono">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">All reviews</h2>
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-sm text-ink-soft">No reviews submitted yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="paper-sheet rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-admin-accent">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {r.sentiment && (
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm ${sentimentColor[r.sentiment] ?? ""}`}>
                      {r.sentiment}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-soft">{r.user_name || r.user_email} · {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-sm mb-2">{r.content}</p>
              {r.ai_reply && (
                <p className="text-xs text-ink-soft border-l-2 border-admin-accent-soft pl-2">
                  <span className="font-medium">Auto-reply sent:</span> {r.ai_reply}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
