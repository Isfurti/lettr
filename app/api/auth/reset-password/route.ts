import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { resetPasswordWithToken } from "@/lib/db";

const Schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  if (!(await resetPasswordWithToken(parsed.data.token, passwordHash))) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
