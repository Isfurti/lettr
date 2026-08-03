import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { listResumesForUser, upsertResume, countResumesForUser, getUserById, logActivity } from "@/lib/db";
import { emptyResume } from "@/lib/types";
import { canCreateResume, canUseTemplate, type Plan } from "@/lib/limits";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const rows = await listResumesForUser(userId);
  return NextResponse.json(
    rows.map((r) => ({ ...r, data: JSON.parse(r.data) }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const currentCount = await countResumesForUser(userId);
  const check = canCreateResume(plan, currentCount);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "Untitled Resume";
  const template = typeof body.template === "string" ? body.template : "classic";

  const templateCheck = canUseTemplate(plan, template);
  if (!templateCheck.allowed) {
    return NextResponse.json({ error: templateCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  const id = randomUUID();

  await upsertResume({
    id,
    userId,
    title,
    template,
    data: JSON.stringify(body.data ?? emptyResume),
  });

  await logActivity(userId, "resume_created", title);

  return NextResponse.json({ id, title, template }, { status: 201 });
}
