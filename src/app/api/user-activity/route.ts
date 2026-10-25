import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { visitors } from "@/db/schema";

const PHONE_COOKIE = "viewer_phone";

export async function PATCH(req: Request) {
  const body = await req.json();
  const page = body.page || "/";
  
  const store = await cookies();
  const phone = (store.get(PHONE_COOKIE)?.value || "").trim();
  if (!phone) return NextResponse.json({ updated: false });

  const db = getDb();
  const existing = await db.select().from(visitors).where(eq(visitors.phone, phone)).limit(1);

  if (existing[0]) {
    await db.update(visitors)
      .set({ lastSeen: sql`CURRENT_TIMESTAMP`, lastPage: page, visits: existing[0].visits! + 1 })
      .where(eq(visitors.phone, phone));
  } else {
    await db.insert(visitors).values({ id: crypto.randomUUID(), phone, lastPage: page, visits: 1 });
  }

  return NextResponse.json({ updated: true });
}
