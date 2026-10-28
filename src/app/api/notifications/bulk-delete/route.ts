import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const db = getDb();
    await db.delete(notifications).where(inArray(notifications.id, ids));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
