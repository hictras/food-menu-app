import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
