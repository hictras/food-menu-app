import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const payload = JSON.stringify({
      title: body.title || "Menu",
      body: body.body || "New recipe added",
      url: body.url || "/",
    });

    const subs = await db.select().from(pushSubscriptions);
    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    );

    // Clean up expired subscriptions
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected" && (r.reason as any)?.statusCode === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, subs[i].endpoint));
      }
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === "fulfilled").length,
      total: subs.length,
    });
  } catch (err) {
    console.error("Send error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
