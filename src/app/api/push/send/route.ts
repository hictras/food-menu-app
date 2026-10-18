import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getDb } from "@/db";
import { pushSubscriptions, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    let previewImage = null;
    let previewTitle = null;

    // Only fetch preview if a valid URL is provided
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

    await db.insert(notifications).values({ title, body: text, url, previewImage, previewTitle });

    const payload = JSON.stringify({ title, body: text, url: "/inbox" });
    const subs = await db.select().from(pushSubscriptions);
    
    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload))
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected" && (r.reason as any)?.statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subs[i].endpoint));
      }
    }

    return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length });
  } catch (err) {
    console.error("Send error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
