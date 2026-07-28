import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { FeedbackForm } from "@/components/FeedbackForm";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex-1 flex app-shell">
      <AppSidebar eyebrow="Resume workspace" />
      <main className="flex-1 px-10 py-10 max-w-xl">
        <h1 className="font-display font-semibold text-3xl mb-1">How's Lettr working for you?</h1>
        <p className="text-ink-soft mb-8">
          Tell us what's working and what isn't — a real person reads every one, and our team follows
          up on real feedback.
        </p>
        <FeedbackForm />
      </main>
    </div>
  );
}
