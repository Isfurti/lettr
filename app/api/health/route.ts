import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    // Public endpoint: say it is down, but keep the database's own message to the server log.
    console.error("Health check: database unreachable", err);
    return NextResponse.json(
      { status: "error", db: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
