import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getResume } from "@/lib/db";
import { ResumeEditor } from "@/components/ResumeEditor";
import type { ResumeData } from "@/lib/types";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const row = await getResume(id, userId);
  if (!row) notFound();

  const data = JSON.parse(row.data) as ResumeData;

  return (
    <ResumeEditor
      resumeId={row.id}
      initialTitle={row.title}
      initialTemplate={row.template}
      initialData={data}
    />
  );
}
