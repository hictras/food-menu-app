import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeDictionary } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(storeDictionary).orderBy(desc(storeDictionary.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const body = await req.json();
  if (!body.ar || !body.en) return NextResponse.json({ error: "Both ar and en are required" }, { status: 400 });

  try {
    const [inserted] = await db.insert(storeDictionary).values({
      ar: body.ar.trim(),
      en: body.en.trim(),
    }).returning();
    return NextResponse.json(inserted);
  } catch (err: any) {
    if (String(err).includes("UNIQUE")) {
      return NextResponse.json({ error: "This Arabic word already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(storeDictionary).where(eq(storeDictionary.id, id));
  return NextResponse.json({ ok: true });
}
