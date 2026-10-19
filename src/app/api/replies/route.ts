import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { polls, pollResponses, notifications, pushSubscriptions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

function isValidPhone(p: string | null | undefined): p is string {
  if (!p) return false;
  const t = p.trim();
  if (!t) return false;
  if (t.toLowerCase() === "unknown") return false;
  return true;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();

    const allPolls = await db.select().from(polls).orderBy(desc(polls.id));
    const allResponses = await db.select().from(pollResponses);
    const allNotifications = await db.select().from(notifications);
    const allSubs = await db.select().from(pushSubscriptions);

    const notifById = new Map<number, typeof notifications.$inferSelect>();
    for (const n of allNotifications) notifById.set(n.id, n);

    const subByPhone = new Map<string, { name: string | null }>();
    for (const s of allSubs) {
      if (!isValidPhone(s.phoneNumber)) continue;
      if (!subByPhone.has(s.phoneNumber)) subByPhone.set(s.phoneNumber, { name: s.name });
    }

    const replies = [];

    for (const poll of allPolls) {
      const notif = notifById.get(poll.notificationId);
      if (!notif) continue;

      const responses = allResponses.filter((r) => r.pollId === poll.id && isValidPhone(r.phone));

      const target = notif.targetPhone || "all";
      let invitees: string[];
      if (!target || target === "all") {
        invitees = Array.from(subByPhone.keys());
      } else {
        invitees = target.split(",").map((s) => s.trim()).filter(isValidPhone);
      }

      const answerByPhone = new Map<string, string>();
      for (const r of responses) answerByPhone.set(r.phone, r.answer);

      const yesVoters = responses
        .filter((r) => r.answer === "yes")
        .sort((a, b) => (a.respondedAt || "").localeCompare(b.respondedAt || ""))
        .map((r) => ({
          phone: r.phone,
          name: r.name || subByPhone.get(r.phone)?.name || null,
          respondedAt: r.respondedAt,
        }));

      const noVoters = responses
        .filter((r) => r.answer === "no")
        .sort((a, b) => (a.respondedAt || "").localeCompare(b.respondedAt || ""))
        .map((r) => ({
          phone: r.phone,
          name: r.name || subByPhone.get(r.phone)?.name || null,
          respondedAt: r.respondedAt,
        }));

      const pendingVoters = invitees
        .filter((phone) => !answerByPhone.has(phone))
        .map((phone) => ({
          phone,
          name: subByPhone.get(phone)?.name || null,
        }));

      // Combined list of all voters (yes + no) sorted by time ascending
      const allVoters = [
        ...yesVoters.map((v) => ({ ...v, answer: "yes" as const })),
        ...noVoters.map((v) => ({ ...v, answer: "no" as const })),
      ].sort((a, b) => (a.respondedAt || "").localeCompare(b.respondedAt || ""));

      const lastVoteAt = responses.length
        ? responses.map((r) => r.respondedAt || "").sort().reverse()[0]
        : null;

      replies.push({
        pollId: poll.id,
        question: poll.question,
        isOpen: !!poll.isOpen,
        createdAt: poll.createdAt,
        lastVoteAt,
        targetPhone: target,
        inviteeCount: invitees.length,
        counts: {
          yes: yesVoters.length,
          no: noVoters.length,
          pending: pendingVoters.length,
          total: invitees.length,
        },
        voters: allVoters,
        pending: pendingVoters,
      });
    }

    // Sort: polls with recent votes first, unanswered last
    replies.sort((a, b) => {
      const aTime = a.lastVoteAt || "";
      const bTime = b.lastVoteAt || "";
      if (aTime && !bTime) return -1;
      if (!aTime && bTime) return 1;
      if (aTime && bTime) return bTime.localeCompare(aTime);
      return b.pollId - a.pollId;
    });

    return NextResponse.json(replies);
  } catch (err) {
    console.error("GET /api/replies error:", err);
    return NextResponse.json({ error: "Failed to load replies" }, { status: 500 });
  }
}
