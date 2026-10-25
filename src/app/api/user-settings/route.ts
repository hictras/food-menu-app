import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { userSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET() {
  try {
    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({});

    const db = getDb();
    const rows = await db.select().from(userSettings).where(eq(userSettings.phone, phone));
    const result: Record<string, string> = {};
    for (const r of rows) result[r.key] = r.value;
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET user settings error:", err);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ ok: false, reason: "no_phone" });

    const body = await req.json();
    const { key, value } = body;
    if (!key || !value) return NextResponse.json({ error: "Missing key or value" }, { status: 400 });

    const db = getDb();
    const existing = await db
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.phone, phone), eq(userSettings.key, key)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userSettings)
        .set({ value, updatedAt: new Date().toISOString() })
        .where(eq(userSettings.id, existing[0].id));
    } else {
      await db.insert(userSettings).values({ phone, key, value });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST user settings error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
