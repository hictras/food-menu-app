import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const sub = await req.json();

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await db
      .insert(pushSubscriptions)
      .values({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
