import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { notifications, polls } from "@/db/schema";
import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const admin = await isAdmin();
    const store = await cookies();
    const cookiePhone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    const queryPhone = (req.nextUrl.searchParams.get("phone") || "").trim();
    const phone = cookiePhone || queryPhone;
    const all = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
    const allPolls = await db.select().from(polls);
    const pollByNotifId = new Map();
    for (const p of allPolls) {
      pollByNotifId.set(p.notificationId, { id: p.id, question: p.question, isOpen: p.isOpen });
    }
    function enrich(n: any) {
      const poll = pollByNotifId.get(n.id);
      return {
        ...n,
        pollId: poll ? poll.id : null,
        pollQuestion: poll ? poll.question : null,
        pollIsOpen: poll ? poll.isOpen : null,
      };
    }
    if (admin) return NextResponse.json(all.map(enrich));
    if (!phone) {
      return NextResponse.json(all.filter((n: any) => n.targetPhone === "all").map(enrich));
    }
    const filtered = all.filter((n: any) => {
      if (!n.targetPhone) return false;
      if (n.targetPhone === "all") return true;
      const targets = n.targetPhone.split(",").map((s: string) => s.trim());
      return targets.includes(phone);
    });
    return NextResponse.json(filtered.map(enrich));
  } catch (err) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
