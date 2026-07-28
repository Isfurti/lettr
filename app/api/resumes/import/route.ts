import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, countResumesForUser, upsertResume, logActivity } from "@/lib/db";
import { canCreateResume, type Plan } from "@/lib/limits";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { extractTextFromFile } from "@/lib/extract-text";
import { extractResumeFromText } from "@/lib/ai";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Same free-tier resume cap applies to an imported resume as a created
  // one - importing isn't a way around the plan limit.
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const currentCount = await countResumesForUser(userId);
  const limitCheck = canCreateResume(plan, currentCount);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  // This calls the AI API, same cost profile as the other AI endpoints.
  const rateLimit = await checkAndRecordRateLimit(userId, "resume-import", 10, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await extractTextFromFile(buffer, file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read that file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!text.trim() || text.trim().length < 20) {
    return NextResponse.json(
      { error: "Couldn't find readable text in that file. Try a different file, or build manually instead." },
      { status: 400 }
    );
  }

  let resumeData;
  try {
    resumeData = await extractResumeFromText(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI extraction failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const id = randomUUID();
  const title = resumeData.contact.fullName ? `${resumeData.contact.fullName}'s Resume` : "Imported Resume";
  await upsertResume({ id, userId, title, template: "classic", data: JSON.stringify(resumeData) });
  await logActivity(userId, "resume_imported", file.name);

  return NextResponse.json({ id, title }, { status: 201 });
}
