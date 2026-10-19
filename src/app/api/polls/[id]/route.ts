import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { polls, pollResponses, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

const VIEWER_PHONE_COOKIE = "viewer_phone";

function parseTargetPhones(targetPhone: string | null): string[] {
  if (!targetPhone || targetPhone === "all") return [];
  return targetPhone.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pollId = Number(id);
    if (Number.isNaN(pollId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, poll.notificationId))
      .limit(1);

    const responses = await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId));

    const yes = responses.filter((r) => r.answer === "yes");
    const no = responses.filter((r) => r.answer === "no");

    const store = await cookies();
    const viewerPhone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    const myResponse = viewerPhone ? responses.find((r) => r.phone === viewerPhone) : null;

    const targetPhones = parseTargetPhones(notification?.targetPhone || null);
    const isTargetedToMe = !targetPhones.length || (viewerPhone && targetPhones.includes(viewerPhone));

    const recipeUrl =
      notification?.url && notification.url !== "/inbox" && !notification.url.startsWith("/poll/")
        ? notification.url
        : null;

    return NextResponse.json({
      id: poll.id,
      question: poll.question,
      isOpen: !!poll.isOpen,
      title: notification?.title || poll.question,
      body: notification?.body || "",
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pollId = Number(id);
    if (Number.isNaN(pollId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();
    const body = await req.json();
    const answer = (body.answer || "").toString().toLowerCase();
    if (answer !== "yes" && answer !== "no") {
      return NextResponse.json({ error: "Answer must be yes or no" }, { status: 400 });
    }

    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) {
      return NextResponse.json({ error: "Verify your phone first" }, { status: 401 });
    }

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!poll.isOpen) return NextResponse.json({ error: "Poll is closed" }, { status: 400 });

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, poll.notificationId))
      .limit(1);

    const targetPhones = parseTargetPhones(notification?.targetPhone || null);
    if (targetPhones.length > 0 && !targetPhones.includes(phone)) {
      return NextResponse.json({ error: "You are not invited to this poll" }, { status: 403 });
    }

    const existing = await db
      .select()
      .from(pollResponses)
      .where(eq(pollResponses.pollId, pollId))
      .then((rows) => rows.find((r) => r.phone === phone));

    if (existing) {
      await db
        .update(pollResponses)
        .set({ answer, respondedAt: new Date().toISOString() })
        .where(eq(pollResponses.id, existing.id));
    } else {
      await db.insert(pollResponses).values({
        pollId,
        phone,
        answer,
        name: null,
        respondedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, answer });
  } catch (err) {
    console.error("POST vote error:", err);
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
