import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getResume, upsertResume, deleteResume, getUserById } from "@/lib/db";
import { canUseTemplate, type Plan } from "@/lib/limits";
import { isNewerThanSupported, parseStoredResume } from "@/lib/resume-version";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const row = await getResume(id, userId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...row, data: parseStoredResume(row.data) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const existing = await getResume(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A row saved by a newer version of Lettr (this can only be an older build,
  // a rollback or a preview) must not be rewritten in the older shape.
  if (isNewerThanSupported(JSON.parse(existing.data))) {
    return NextResponse.json(
      { error: "This resume was saved by a newer version of Lettr. Reload the page and try again." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (body.data !== undefined && isNewerThanSupported(body.data)) {
    return NextResponse.json({ error: "Unsupported resume version." }, { status: 400 });
  }
  const template = body.template ?? existing.template;

  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const templateCheck = canUseTemplate(plan, template);
  if (!templateCheck.allowed) {
    return NextResponse.json({ error: templateCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  await upsertResume({
    id,
    userId,
    title: body.title ?? existing.title,
    template,
    data: JSON.stringify(body.data ?? JSON.parse(existing.data)),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await deleteResume(id, userId);
  return NextResponse.json({ ok: true });
}
