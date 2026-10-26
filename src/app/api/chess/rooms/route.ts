import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, or, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { chessRooms } from "@/db/schema";

const PHONE_COOKIE = "viewer_phone";

const START_BOARD = JSON.stringify([
  [["r","b"],["n","b"],["b","b"],["q","b"],["k","b"],["b","b"],["n","b"],["r","b"]],
  Array(8).fill(["p","b"]),
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  Array(8).fill(["p","w"]),
  [["r","w"],["n","w"],["b","w"],["q","w"],["k","w"],["b","w"],["n","w"],["r","w"]],
]);

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  try {
    const store = await cookies();
    const phone = (store.get(PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ rooms: [] });

    const db = getDb();
    const rows = await db
      .select()
      .from(chessRooms)
      .where(or(eq(chessRooms.whitePhone, phone), eq(chessRooms.blackPhone, phone)))
      .orderBy(desc(chessRooms.createdAt))
      .limit(20);

    return NextResponse.json({ rooms: rows });
  } catch (error) {
    return NextResponse.json({ rooms: [], error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const store = await cookies();
    const phone = (store.get(PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ error: "no_phone" }, { status: 401 });

    const db = getDb();
    let code = "";
    for (let i = 0; i < 10; i++) {
      code = makeCode();
      const existing = await db.select().from(chessRooms).where(eq(chessRooms.code, code)).limit(1);
      if (existing.length === 0) break;
      code = "";
    }
    if (!code) return NextResponse.json({ error: "code_generation_failed" }, { status: 500 });

    const [inserted] = await db.insert(chessRooms).values({
      code,
      whitePhone: phone,
      board: START_BOARD,
      turn: "w",
      status: "waiting",
    }).returning();

    return NextResponse.json({ room: inserted });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
