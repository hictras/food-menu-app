import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { chessRooms } from "@/db/schema";

const PHONE_COOKIE = "viewer_phone";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const db = getDb();
    const rows = await db.select().from(chessRooms).where(eq(chessRooms.code, code.toUpperCase())).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ room: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const store = await cookies();
    const phone = (store.get(PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ error: "no_phone" }, { status: 401 });

    const db = getDb();
    const rows = await db.select().from(chessRooms).where(eq(chessRooms.code, code.toUpperCase())).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const room = rows[0];
    if (room.whitePhone === phone || room.blackPhone === phone) {
      return NextResponse.json({ room, role: room.whitePhone === phone ? "white" : "black" });
    }
    if (room.blackPhone) return NextResponse.json({ error: "room_full" }, { status: 400 });

    const [updated] = await db.update(chessRooms)
      .set({ blackPhone: phone, status: "active", updatedAt: new Date().toISOString() })
      .where(eq(chessRooms.code, code.toUpperCase()))
      .returning();

    return NextResponse.json({ room: updated, role: "black" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
