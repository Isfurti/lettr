import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeProfile } from "@/lib/db";

export const runtime = "nodejs";

/** Stops sharing and drops the link for good; sharing again makes a new one. Never blocked, never rate limited. */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await revokeProfile((session.user as { id: string }).id);
  return NextResponse.json({ ok: true });
}
