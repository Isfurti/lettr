import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { listResumesForUser, upsertResume } from "@/lib/db";
import { emptyResume } from "@/lib/types";

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
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "Untitled Resume";
  const template = typeof body.template === "string" ? body.template : "classic";
  const id = randomUUID();

  await upsertResume({
    id,
    userId,
    title,
    template,
    data: JSON.stringify(body.data ?? emptyResume),
  });

  return NextResponse.json({ id, title, template }, { status: 201 });
}
