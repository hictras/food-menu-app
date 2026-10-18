import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(settings);
    const data = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb();
    const body = await req.json(); // Expecting { today_color: "#ff0000", ... }

    for (const [key, value] of Object.entries(body)) {
      await db.insert(settings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
