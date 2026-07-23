import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { polishBullet } from "@/lib/ai";

const Schema = z.object({
  roughBullet: z.string().min(3).max(1000),
  role: z.string().min(1).max(200),
  targetJobDescription: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const options = await polishBullet(parsed.data);
    return NextResponse.json({ options });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
