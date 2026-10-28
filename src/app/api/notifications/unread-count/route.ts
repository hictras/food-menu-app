import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const admin = await isAdmin();

    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();

    const sinceParam = req.nextUrl.searchParams.get("since");
    const since = sinceParam || "1970-01-01T00:00:00Z";

    const all = await db.select().from(notifications);

    const filtered = all.filter((n) => {
      if (!n.createdAt) return false;
      if (new Date(n.createdAt) <= new Date(since)) return false;
      if (admin) return true;
      if (!phone) return n.targetPhone === "all";
      if (!n.targetPhone) return false;
      if (n.targetPhone === "all") return true;
      const targets = n.targetPhone.split(",").map((s) => s.trim());
      return targets.includes(phone);
    });

    return NextResponse.json({ count: filtered.length });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
