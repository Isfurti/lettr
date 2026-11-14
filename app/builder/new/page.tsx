import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listResumesForUser } from "@/lib/db";
import { GuestResumeEditor } from "@/components/GuestResumeEditor";
import { StartResume } from "@/components/StartResume";

export default async function NewResumeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; tab?: string }>;
}) {
  const session = await auth();
  const { template, tab } = await searchParams;

  if (session?.user) {
    // Signed in: "Build my resume" should land in the builder, not the
    // dashboard. No template picked -> carry on with their latest resume.
    // A template picked, or no resume yet -> start a new one.
    const userId = (session.user as { id: string }).id;
    const latest = (await listResumesForUser(userId))[0];
    // ?tab=cover-letter (from the cover letter page) opens that tab; the builder checks the name.
    const tabQuery = tab && /^[a-z-]+$/.test(tab) ? `?tab=${tab}` : "";
    if (latest && !template) redirect(`/builder/${latest.id}${tabQuery}`);
    return <StartResume template={template || "classic"} fallbackId={latest?.id} />;
  }

  return <GuestResumeEditor initialTemplate={template || "classic"} />;
}
