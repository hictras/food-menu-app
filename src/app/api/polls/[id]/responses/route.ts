import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { polls, pollResponses, notifications, pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

function isValidPhone(p: string | null | undefined): p is string {
  if (!p) return false;
  const t = p.trim();
  if (!t) return false;
  if (t.toLowerCase() === "unknown") return false;
  return true;
}

export async function GET(
  _req: NextRequest,
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

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, poll.notificationId))
      .limit(1);

    const responses = await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId));

    const allSubs = await db.select().from(pushSubscriptions);
    const subByPhone = new Map<string, { name: string | null; phoneNumber: string }>();
    for (const s of allSubs) {
      if (!isValidPhone(s.phoneNumber)) continue;
      if (!subByPhone.has(s.phoneNumber)) {
        subByPhone.set(s.phoneNumber, { name: s.name, phoneNumber: s.phoneNumber });
      }
    }

    const target = notification?.targetPhone || "all";
    let invitees: string[];
    if (!target || target === "all") {
      invitees = Array.from(subByPhone.keys());
    } else {
      invitees = target.split(",").map((s) => s.trim()).filter(isValidPhone);
    }

    const answerByPhone = new Map<string, string>();
    for (const r of responses) {
      if (isValidPhone(r.phone)) answerByPhone.set(r.phone, r.answer);
    }

    const yes = responses
      .filter((r) => r.answer === "yes" && isValidPhone(r.phone))
      .map((r) => {
        const sub = subByPhone.get(r.phone);
        return {
          phone: r.phone,
          name: r.name || sub?.name || null,
          respondedAt: r.respondedAt,
        };
      });

    const no = responses
      .filter((r) => r.answer === "no" && isValidPhone(r.phone))
      .map((r) => {
        const sub = subByPhone.get(r.phone);
        return {
          phone: r.phone,
          name: r.name || sub?.name || null,
          respondedAt: r.respondedAt,
        };
      });

    const pending = invitees
      .filter((phone) => !answerByPhone.has(phone))
      .map((phone) => {
        const sub = subByPhone.get(phone);
        return {
          phone,
          name: sub?.name || null,
        };
      });

    return NextResponse.json({
      pollId: poll.id,
      question: poll.question,
      isOpen: !!poll.isOpen,
      yes,
      no,
      pending,
      counts: {
        yes: yes.length,
        no: no.length,
        pending: pending.length,
        total: invitees.length,
      },
    });
  } catch (err) {
    console.error("GET responses error:", err);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }
}
