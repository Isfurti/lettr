import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getUserById, getResume, logAdminAction } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";
import type { ResumeData } from "@/lib/types";

export default async function AdminResumeViewPage({
  params,
}: {
  params: Promise<{ id: string; resumeId: string }>;
}) {
  const session = await requireAdmin();
  const { id, resumeId } = await params;

  const user = await getUserById(id);
  const row = await getResume(resumeId, id);
  if (!user || !row) notFound();

  const data = JSON.parse(row.data) as ResumeData;

  await logAdminAction({
    adminUserId: (session.user as { id: string }).id,
    action: "viewed_resume",
    targetUserId: id,
    detail: `${user.email}: "${row.title}"`,
  });

  return (
    <div className="flex-1 flex app-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-2xl">
        <Link href={`/admin/users/${id}`} className="text-sm text-ink-soft hover:text-ink mb-4 inline-block">
          ← Back to {user.name || user.email}
        </Link>
        <p className="text-xs uppercase tracking-wide text-seal font-medium mb-1">Read-only admin view</p>
        <h1 className="font-display font-semibold text-2xl mb-6">{row.title}</h1>

        <div className="paper-sheet rounded-sm p-8">
          <h2 className="font-display font-bold text-xl">{data.contact.fullName || "—"}</h2>
          <p className="text-xs text-ink-soft mt-1 mb-4">
            {[data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin, data.contact.website]
              .filter(Boolean)
              .join("  •  ")}
          </p>

          {data.summary && (
            <>
              <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mt-4 mb-1">Summary</h3>
              <p className="text-sm">{data.summary}</p>
            </>
          )}

          {data.experience.length > 0 && (
            <>
              <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mt-4 mb-1">Experience</h3>
              {data.experience.map((exp) => (
                <div key={exp.id} className="mt-2">
                  <p className="text-sm font-medium">{exp.role} — {exp.company} ({exp.startDate}–{exp.endDate})</p>
                  <ul className="mt-1 space-y-0.5">
                    {exp.bullets.map((b, i) => <li key={i} className="text-sm pl-4">• {b}</li>)}
                  </ul>
                </div>
              ))}
            </>
          )}

          {data.education.length > 0 && (
            <>
              <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mt-4 mb-1">Education</h3>
              {data.education.map((edu) => (
                <p key={edu.id} className="text-sm">{edu.degree} — {edu.school} ({edu.startDate}–{edu.endDate})</p>
              ))}
            </>
          )}

          {data.skills.length > 0 && (
            <>
              <h3 className="text-xs uppercase tracking-wide text-seal font-semibold mt-4 mb-1">Skills</h3>
              <p className="text-sm">{data.skills.join(" • ")}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
