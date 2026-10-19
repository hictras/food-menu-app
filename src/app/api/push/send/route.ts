import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getDb } from "@/db";
import { pushSubscriptions, notifications, polls } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

function initWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) throw new Error("Missing VAPID env vars");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    initWebPush();
    const db = getDb();
    const body = await req.json();

    const title = body.title || "Menu";
    const text = body.body || "New recipe added";
    const url = body.url || "/inbox";
    const targetPhone = body.targetPhone || "all";
    const pollQuestion = (body.poll?.question || "").trim();

    let previewImage = null;
    let previewTitle = null;

    if (url.startsWith("http")) {
      try {
        const res = await fetch(url);
        const html = await res.text();
        const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (imgMatch) previewImage = imgMatch[1];
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (titleMatch) previewTitle = titleMatch[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
      } catch (err) {
        console.error("Failed to fetch link preview:", err);
      }
    }

    const [inserted] = await db.insert(notifications).values({
      title,
      body: text,
      url,
      previewImage,
      previewTitle,
      targetPhone,
      pollUrl: null,
    }).returning();

    let pollId: number | null = null;
    let pollUrl: string | null = null;
    let pushUrl = url;

    if (pollQuestion) {
      const [poll] = await db.insert(polls).values({
        notificationId: inserted.id,
        question: pollQuestion,
        isOpen: 1,
      }).returning();
      pollId = poll.id;
      pollUrl = `/poll/${poll.id}`;
      pushUrl = pollUrl;

      // Save pollUrl on the notification row
      await db.update(notifications).set({ pollUrl }).where(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import("drizzle-orm")).eq(notifications.id, inserted.id) as any
      );
    }

    const payload = JSON.stringify({
      title: pollQuestion || title,
      body: pollQuestion ? `Tap to RSVP: ${text}` : text,
      url: pushUrl,
    });

    let subs;
    if (targetPhone === "all") {
      subs = await db.select().from(pushSubscriptions);
    } else {
      const phones = targetPhone.split(",").map((p: string) => p.trim()).filter(Boolean);
      if (phones.length === 0) subs = await db.select().from(pushSubscriptions);
      else subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.phoneNumber, phones));
    }

    if (subs.length === 0) {
      return NextResponse.json({ error: "No subscriptions found" }, { status: 404 });
    }

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload))
    );

    return NextResponse.json({
      sent: results.filter((r) => r.status === "fulfilled").length,
      total: subs.length,
      pollId,
    });
  } catch (err) {
    console.error("Send error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
