import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gameStats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const game = req.nextUrl.searchParams.get("game") || "catch";

    const db = getDb();
    const rows = await db.select().from(gameStats).where(eq(gameStats.game, game));

    const parsedRows = rows.map((r) => ({
      phone: r.phone,
      stats: JSON.parse(r.stats || "{}"),
    })).filter((r) => Object.keys(r.stats).length > 0);

    parsedRows.sort((a, b) => {
      if (game === "memory") {
        const aTime = a.stats.bestTime === 0 ? 99999 : a.stats.bestTime;
        const bTime = b.stats.bestTime === 0 ? 99999 : b.stats.bestTime;
        return aTime - bTime;
      }
      if (game === "catch" || game === "snake") {
        return (b.stats.bestCatched || b.stats.bestScore || 0) - (a.stats.bestCatched || a.stats.bestScore || 0);
      }
      return (b.stats.wins || b.stats.guessed || b.stats.solved || 0) - (a.stats.wins || a.stats.guessed || a.stats.solved || 0);
    });

    return NextResponse.json({ leaderboard: parsedRows.slice(0, 50) });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
