import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pushPresets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const presets = await db.select().from(pushPresets);
  return NextResponse.json(presets);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const body = await req.json();
  const [inserted] = await db.insert(pushPresets).values({
    name: body.name,
    title: body.title,
    body: body.body,
    pollQuestion: body.pollQuestion || null,
  }).returning();
  return NextResponse.json(inserted);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const body = await req.json();
  await db.update(pushPresets).set({
    name: body.name,
    title: body.title,
    body: body.body,
    pollQuestion: body.pollQuestion || null,
  }).where(eq(pushPresets.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const id = Number(req.nextUrl.searchParams.get("id"));
  await db.delete(pushPresets).where(eq(pushPresets.id, id));
  return NextResponse.json({ ok: true });
}
