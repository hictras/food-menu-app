import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import webpush from "web-push";
import { getDb } from "@/db";
import { polls, pollResponses, notifications, pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

const VIEWER_PHONE_COOKIE = "viewer_phone";
const THROTTLE_WINDOW_MS = 60000;

const pendingBatches = new Map<number, { timer: NodeJS.Timeout; yes: number; no: number }>();

function initWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) throw new Error("Missing VAPID env vars");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function parseTargetPhones(targetPhone: string | null): string[] {
  if (!targetPhone || targetPhone === "all") return [];
  return targetPhone.split(",").map((s: string) => s.trim()).filter(Boolean);
}

async function sendAdminPush(db: ReturnType<typeof getDb>, question: string, yesCount: number, noCount: number, pollId: number) {
  const adminPhone = (process.env.ADMIN_PHONE || "").trim();
  console.log("[admin-notify] ADMIN_PHONE=", JSON.stringify(adminPhone));
  if (!adminPhone) {
    console.log("[admin-notify] SKIPPED - ADMIN_PHONE not set");
    return;
  }
  try {
    initWebPush();
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.phoneNumber, adminPhone));
    console.log("[admin-notify] found", subs.length, "subs for", adminPhone);
    if (subs.length === 0) return;

    const parts = [];
    if (yesCount > 0) parts.push(yesCount + " Yes");
    if (noCount > 0) parts.push(noCount + " No");
    const countStr = parts.join(", ") || "0";

    const payload = JSON.stringify({
      title: "Vote on \"" + question + "\"",
      body: countStr + " - tap to see who",
      url: "/poll/" + pollId,
    });

    await Promise.allSettled(subs.map((s: { endpoint: string; p256dh: string; auth: string }) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)));
    console.log("[admin-notify] push sent to", subs.length, "device(s)");
  } catch (err) {
    console.error("[admin-notify] Admin push failed:", err);
  }
}

function scheduleAdminNotify(db: ReturnType<typeof getDb>, pollId: number, question: string, answer: "yes" | "no") {
  const existing = pendingBatches.get(pollId);
  if (existing) {
    if (answer === "yes") existing.yes += 1;
    else existing.no += 1;
    console.log("[admin-notify] batched vote - yes:", existing.yes, "no:", existing.no);
    return;
  }
  const batch = {
    timer: setTimeout(async () => {
      const counts = pendingBatches.get(pollId);
      pendingBatches.delete(pollId);
      if (!counts) return;
      await sendAdminPush(db, question, counts.yes, counts.no, pollId);
    }, THROTTLE_WINDOW_MS),
    yes: answer === "yes" ? 1 : 0,
    no: answer === "no" ? 1 : 0,
  };
  pendingBatches.set(pollId, batch);
  sendAdminPush(db, question, batch.yes, batch.no, pollId).catch((err) => console.error("[admin-notify] first vote push error:", err));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pollId = Number(id);
    if (Number.isNaN(pollId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

    const [notification] = await db.select().from(notifications).where(eq(notifications.id, poll.notificationId)).limit(1);
    const responses = await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId));

    const yes = responses.filter((r) => r.answer === "yes");
    const no = responses.filter((r) => r.answer === "no");

    const store = await cookies();
    
    // Look up the user's name to replace {name}
    const viewerPhone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    let viewerName: string | null = null;
    if (viewerPhone) {
      const [sub] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.phoneNumber, viewerPhone)).limit(1);
      if (sub && sub.name) viewerName = sub.name.trim();
    }

    function personalize(t: string | null | undefined): string {
      if (!t) return "";
      if (!viewerName) return t.replace(/\{name\}/g, "").replace(/\s+([,.!?;:])/g, "$1").replace(/\s{2,}/g, " ").trim();
      return t.replace(/\{name\}/g, viewerName);
    }
  
    const myResponse = viewerPhone ? responses.find((r) => r.phone === viewerPhone) : null;

    const targetPhones = parseTargetPhones(notification?.targetPhone || null);
    const isTargetedToMe = !targetPhones.length || (viewerPhone && targetPhones.includes(viewerPhone));

    const rawUrl = notification?.url || null;
    const recipeUrl = rawUrl && rawUrl !== "/inbox" && !rawUrl.startsWith("/poll/") ? rawUrl : null;

    return NextResponse.json({
      id: poll.id,
      question: personalize(poll.question),
      isOpen: !!poll.isOpen,
      title: personalize(notification?.title || poll.question),
      body: personalize(notification?.body || ""),
      targetPhone: notification?.targetPhone || "all",
      recipeUrl,
      yesCount: yes.length,
      noCount: no.length,
      myAnswer: myResponse ? myResponse.answer : null,
      canVote: !!viewerPhone && isTargetedToMe && !!poll.isOpen,
      hasPhoneCookie: !!viewerPhone,
      isTargetedToMe,
    });
  } catch (err) {
    console.error("GET poll error:", err);
    return NextResponse.json({ error: "Failed to load poll" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pollId = Number(id);
    if (Number.isNaN(pollId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();
    const body = await req.json();
    const answer = (body.answer || "").toString().toLowerCase();
    if (answer !== "yes" && answer !== "no") return NextResponse.json({ error: "Answer must be yes or no" }, { status: 400 });

    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ error: "Verify your phone first" }, { status: 401 });

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!poll.isOpen) return NextResponse.json({ error: "Poll is closed" }, { status: 400 });

    const [notification] = await db.select().from(notifications).where(eq(notifications.id, poll.notificationId)).limit(1);
    const targetPhones = parseTargetPhones(notification?.targetPhone || null);
    if (targetPhones.length > 0 && !targetPhones.includes(phone)) return NextResponse.json({ error: "You are not invited to this poll" }, { status: 403 });

    const existing = await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId)).then((rows) => rows.find((r) => r.phone === phone));
    const prevAnswer = existing?.answer;

    if (existing) {
      await db.update(pollResponses).set({ answer, respondedAt: new Date().toISOString() }).where(eq(pollResponses.id, existing.id));
    } else {
      await db.insert(pollResponses).values({ pollId, phone, answer, name: null, respondedAt: new Date().toISOString() });
    }

    console.log("[admin-notify] vote:", prevAnswer, "->", answer, "poll:", pollId);
    if (prevAnswer !== answer) {
      scheduleAdminNotify(db, pollId, poll.question, answer);
    }

    return NextResponse.json({ ok: true, answer });
  } catch (err) {
    console.error("POST vote error:", err);
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const pollId = Number(id);
    if (Number.isNaN(pollId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();
    const body = await req.json();
    const isOpen = body.isOpen ? 1 : 0;

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

    await db.update(polls).set({ isOpen }).where(eq(polls.id, pollId));
    return NextResponse.json({ ok: true, isOpen: !!isOpen });
  } catch (err) {
    console.error("PUT poll error:", err);
    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}
