import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { chessRooms } from "@/db/schema";

const PHONE_COOKIE = "viewer_phone";

type Piece = [string, string] | null;
type Board = Piece[][];

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const store = await cookies();
    const phone = (store.get(PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ error: "no_phone" }, { status: 401 });

    const body = await req.json();
    const { newBoard, newTurn, winner } = body as { newBoard: Board; newTurn: "w" | "b"; winner?: string | null };

    const db = getDb();
    const rows = await db.select().from(chessRooms).where(eq(chessRooms.code, code.toUpperCase())).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const room = rows[0];

    const myColor =
      room.whitePhone === phone ? "w" :
      room.blackPhone === phone ? "b" : null;
    if (!myColor) return NextResponse.json({ error: "not_a_player" }, { status: 403 });
    if (room.turn !== myColor) return NextResponse.json({ error: "not_your_turn" }, { status: 400 });
    if (room.status !== "active") return NextResponse.json({ error: "room_not_active" }, { status: 400 });

    const [updated] = await db.update(chessRooms).set({
      board: JSON.stringify(newBoard),
      turn: newTurn,
      winner: winner ?? null,
      status: winner ? "finished" : "active",
      updatedAt: new Date().toISOString(),
    }).where(eq(chessRooms.code, code.toUpperCase())).returning();

    return NextResponse.json({ room: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
