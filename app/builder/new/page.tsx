import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listResumesForUser } from "@/lib/db";
import { GuestResumeEditor } from "@/components/GuestResumeEditor";
import { StartResume } from "@/components/StartResume";

export default async function NewResumeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await auth();
  const { template } = await searchParams;

  if (session?.user) {
    // Signed in: "Build my resume" should land in the builder, not the
    // dashboard. No template picked -> carry on with their latest resume.
    // A template picked, or no resume yet -> start a new one.
    const userId = (session.user as { id: string }).id;
    const latest = (await listResumesForUser(userId))[0];
    if (latest && !template) redirect(`/builder/${latest.id}`);
    return <StartResume template={template || "classic"} fallbackId={latest?.id} />;
  }

  return <GuestResumeEditor initialTemplate={template || "classic"} />;
}
