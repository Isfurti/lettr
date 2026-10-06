import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteInterviewSession } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteInterviewSession(userId, id);
  return NextResponse.json({ ok: true });
}
