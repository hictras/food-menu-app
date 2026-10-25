import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { gameStats } from "@/db/schema";

// ⚠️ IMPORTANT: Ensure this matches the cookie used in user-settings/route.ts
const PHONE_COOKIE = "viewer_phone"; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game");
    if (!game) return NextResponse.json({ error: "Missing game" }, { status: 400 });

    const store = await cookies();
    // Try both common cookie names just in case
    const phone = (store.get(PHONE_COOKIE)?.value || store.get("phone")?.value || "").trim();
    if (!phone) return NextResponse.json({ stats: {} });

    const db = getDb();
    const rows = await db.select().from(gameStats).where(and(eq(gameStats.phone, phone), eq(gameStats.game, game))).limit(1);
    
    return NextResponse.json({ stats: rows[0] ? JSON.parse(rows[0].stats) : {} });
  } catch (error) {
    console.error("GET game-stats error:", error);
    return NextResponse.json({ stats: {}, error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { game, stats } = body;
    if (!game || typeof stats !== "object") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const store = await cookies();
    const phone = (store.get(PHONE_COOKIE)?.value || store.get("phone")?.value || "").trim();
    if (!phone) return NextResponse.json({ saved: false, error: "No phone cookie" });

    const db = getDb();
    const existing = await db.select().from(gameStats).where(and(eq(gameStats.phone, phone), eq(gameStats.game, game))).limit(1);

    const payload = JSON.stringify(stats);

    if (existing[0]) {
      await db.update(gameStats).set({ stats: payload, updatedAt: new Date().toISOString() }).where(eq(gameStats.id, existing[0].id));
    } else {
      await db.insert(gameStats).values({ phone, game, stats: payload });
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("POST game-stats error:", error);
    return NextResponse.json({ saved: false, error: String(error) }, { status: 500 });
  }
}
