import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pushSubscriptions, visitors } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export const VIEWER_PHONE_COOKIE = "viewer_phone";
const VIEWER_PHONE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const sub = body.subscription || body;
    const phoneNumber = (body.phoneNumber || "").trim();
    const visitorId = (body.visitorId || "").trim();

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const existingForPhone = await db
      .select({ endpoint: pushSubscriptions.endpoint })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.phoneNumber, phoneNumber),
          ne(pushSubscriptions.endpoint, sub.endpoint)
        )
      )
      .limit(1);

    if (existingForPhone.length > 0) {
      return NextResponse.json(
        { error: "This phone number is already registered on another device." },
        { status: 409 }
      );
    }

    await db
      .insert(pushSubscriptions)
      .values({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        phoneNumber,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          phoneNumber,
        },
      });

    if (visitorId) {
      await db.update(visitors).set({ phone: phoneNumber }).where(eq(visitors.id, visitorId));
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(VIEWER_PHONE_COOKIE, phoneNumber, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VIEWER_PHONE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
