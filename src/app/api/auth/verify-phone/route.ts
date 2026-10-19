import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const VIEWER_PHONE_COOKIE = "viewer_phone";
const VIEWER_PHONE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const phoneNumber = (body.phoneNumber || "").trim();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // Only allow phones that are actually registered
    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.phoneNumber, phoneNumber))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "This phone is not registered. Enable notifications first." },
        { status: 404 }
      );
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
    console.error("Verify phone error:", err);
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
  }
}
