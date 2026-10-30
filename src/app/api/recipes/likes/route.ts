import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipeLikes } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids") || "";
    const visitorId = (req.nextUrl.searchParams.get("visitorId") || "").trim();

    const ids = idsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (ids.length === 0) return NextResponse.json({});

    const db = getDb();
    const rows = await db.select().from(recipeLikes).where(inArray(recipeLikes.recipeId, ids));

    const result: Record<string, { count: number; liked: boolean }> = {};
    for (const id of ids) result[String(id)] = { count: 0, liked: false };

    for (const r of rows) {
      const key = String(r.recipeId);
      if (!result[key]) continue;
      result[key].count += 1;
      if (visitorId && r.visitorId === visitorId) result[key].liked = true;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET bulk likes error:", err);
    return NextResponse.json({ error: "Failed to load likes" }, { status: 500 });
  }
}
