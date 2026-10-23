import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { visitors, pushSubscriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { id, phone } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.insert(visitors).values({ id, phone }).onConflictDoUpdate({
      target: visitors.id,
      set: { lastSeen: new Date().toISOString(), phone: phone || null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST visitor error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    
    // Join with pushSubscriptions to get the name
    const all = await db
      .select({
        id: visitors.id,
        phone: visitors.phone,
        lastSeen: visitors.lastSeen,
        name: pushSubscriptions.name,
      })
      .from(visitors)
      .leftJoin(pushSubscriptions, eq(visitors.phone, pushSubscriptions.phoneNumber))
      .orderBy(desc(visitors.lastSeen));
      
    return NextResponse.json(all);
  } catch (err) {
    console.error("GET visitor error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
