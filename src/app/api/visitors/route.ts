import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { visitors } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.insert(visitors).values({ id }).onConflictDoUpdate({
      target: visitors.id,
      set: { lastSeen: new Date().toISOString() },
    });

    const all = await db.select().from(visitors);
    return NextResponse.json({ count: all.length });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const all = await db.select().from(visitors).orderBy(desc(visitors.lastSeen));
    return NextResponse.json({ count: all.length, devices: all });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
