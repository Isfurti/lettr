import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getResume, getUserById } from "@/lib/db";
import { ResumeEditor } from "@/components/ResumeEditor";
import type { ResumeData } from "@/lib/types";
import type { Plan } from "@/lib/limits";
import { planAllowances } from "@/lib/free-usage";
import { TEMPLATE_IDS } from "@/lib/templates";

const TABS = ["edit", "score", "match", "agent", "cover-letter", "resignation-letter"] as const;

export default async function BuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; template?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const { tab, template: templateParam } = await searchParams;
  // "Use this template" on a resume that already exists: open it switched to that template.
  const templateOverride = (TEMPLATE_IDS as readonly string[]).includes(templateParam ?? "") ? templateParam : undefined;
  // Deep links like ?tab=cover-letter (from the dashboard) open that tab directly.
  const initialTab = (TABS as readonly string[]).includes(tab ?? "") ? (tab as (typeof TABS)[number]) : "edit";
  const [row, user] = await Promise.all([getResume(id, userId), getUserById(userId)]);
  if (!row) notFound();

  const data = JSON.parse(row.data) as ResumeData;
  const plan = (user?.plan ?? "free") as Plan;
  const googleDriveConnected = Boolean(user?.google_refresh_token);
  const allowances = user && plan === "free" ? await planAllowances(user) : undefined;

  return (
    <ResumeEditor
      resumeId={row.id}
      initialTitle={row.title}
      initialTemplate={row.template}
      initialData={data}
      plan={plan}
      googleDriveConnected={googleDriveConnected}
      templateOverride={templateOverride}
      allowances={allowances}
      initialTab={initialTab}
    />
  );
}
