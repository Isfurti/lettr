import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getResume, getUserById } from "@/lib/db";
import { ResumeEditor } from "@/components/ResumeEditor";
import type { ResumeData } from "@/lib/types";
import type { Plan } from "@/lib/limits";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const [row, user] = await Promise.all([getResume(id, userId), getUserById(userId)]);
  if (!row) notFound();

  const data = JSON.parse(row.data) as ResumeData;
  const plan = (user?.plan ?? "free") as Plan;
  const googleDriveConnected = Boolean(user?.google_refresh_token);
  const userInitial = (session.user.name || session.user.email || "?")[0]?.toUpperCase();

  return (
    <ResumeEditor
      resumeId={row.id}
      initialTitle={row.title}
      initialTemplate={row.template}
      initialData={data}
      plan={plan}
      googleDriveConnected={googleDriveConnected}
      userInitial={userInitial}
      aiWritingAssistsUsed={user?.ai_writing_assist_count ?? 0}
    />
  );
}
