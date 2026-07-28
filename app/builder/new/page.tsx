import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GuestResumeEditor } from "@/components/GuestResumeEditor";

export default async function NewResumeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await auth();
  const { template } = await searchParams;

  // Already logged in? Skip the guest flow entirely and go straight to a
  // real, saved resume - there's no reason to make an authenticated user
  // build in local-storage-land first.
  if (session?.user) redirect("/dashboard");

  return <GuestResumeEditor initialTemplate={template || "classic"} />;
}
