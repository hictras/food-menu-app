import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET() {
  try {
    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ name: null, phone: null });

    const db = getDb();
    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.phoneNumber, phone))
      .limit(1);

    if (rows.length === 0) return NextResponse.json({ name: null, phone: null });

    const name = (rows[0].name || "").trim();
    return NextResponse.json({ name: name || null, phone });
  } catch (err) {
    console.error("Welcome lookup error:", err);
    return NextResponse.json({ name: null, phone: null });
  }
}
