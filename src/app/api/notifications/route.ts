import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const admin = await isAdmin();

    // Phone can come from cookie (normal) or query param (testing/curl)
    const store = await cookies();
    const cookiePhone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    const queryPhone = (req.nextUrl.searchParams.get("phone") || "").trim();
    const phone = cookiePhone || queryPhone;

    const all = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));

    // Admin sees everything
    if (admin) return NextResponse.json(all);

    // No phone → broadcasts only
    if (!phone) {
      return NextResponse.json(all.filter((n) => n.targetPhone === "all"));
    }

    // With phone → broadcasts + targeted-to-me
    const filtered = all.filter((n) => {
      if (!n.targetPhone) return false;
      if (n.targetPhone === "all") return true;
      const targets = n.targetPhone.split(",").map((s) => s.trim());
      return targets.includes(phone);
    });

    return NextResponse.json(filtered);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
