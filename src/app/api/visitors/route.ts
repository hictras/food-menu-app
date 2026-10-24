import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { visitors, pushSubscriptions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { id, phone, lastPage } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // 1. Check if this visitor exists and when they were last seen
    const existing = await db.select().from(visitors).where(eq(visitors.id, id)).limit(1);
    
    let shouldIncrement = true;

    if (existing.length > 0 && existing[0].lastSeen) {
      const lastSeenTime = new Date(existing[0].lastSeen).getTime();
      const now = Date.now();
      // 15 minutes in milliseconds
      const FIFTEEN_MINUTES = 15 * 60 * 1000;

      // If less than 15 minutes have passed, don't increment the count
      if (now - lastSeenTime < FIFTEEN_MINUTES) {
        shouldIncrement = false;
      }
    }

    // 2. Update or insert the visitor
    if (existing.length > 0) {
      await db.update(visitors).set({
        lastSeen: new Date().toISOString(),
        ...(phone ? { phone } : {}),
        ...(lastPage ? { lastPage } : {}),
        ...(shouldIncrement ? { visits: sql`${visitors.visits} + 1` } : {}),
      }).where(eq(visitors.id, id));
    } else {
      await db.insert(visitors).values({ 
        id, 
        phone: phone || null, 
        lastPage: lastPage || null, 
        visits: 1 
      });
    }

    return NextResponse.json({ ok: true, incremented: shouldIncrement });
  } catch (err) {
    console.error("POST visitor error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const all = await db
      .select({
        id: visitors.id,
        phone: visitors.phone,
        visits: visitors.visits,
        lastSeen: visitors.lastSeen,
        lastPage: visitors.lastPage,
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

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const { id, phone } = await req.json();
    if (!id || !phone) return NextResponse.json({ error: "ID and phone required" }, { status: 400 });

    const sub = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.phoneNumber, phone)).limit(1);
    if (sub.length === 0) {
      return NextResponse.json({ error: "Phone not registered for push notifications" }, { status: 404 });
    }

    await db.update(visitors).set({ phone }).where(eq(visitors.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT visitor error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const idParam = req.nextUrl.searchParams.get("id");
    if (!idParam) return NextResponse.json({ error: "ID required" }, { status: 400 });
    
    const id = String(idParam); 
    await db.delete(visitors).where(eq(visitors.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE visitor error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
