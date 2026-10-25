import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { notificationReads } from "@/db/schema";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notificationId = Number(id);
    if (Number.isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) {
      return NextResponse.json({ ok: false, reason: "no_phone" });
    }

    const db = getDb();
    await db
      .insert(notificationReads)
      .values({ notificationId, phone })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST read error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
