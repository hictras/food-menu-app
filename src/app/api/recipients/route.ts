import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const subs = await db.select().from(pushSubscriptions);
  return NextResponse.json(subs);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const body = await req.json();
  
  if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
  await db.update(pushSubscriptions)
    .set({ name: body.name, phoneNumber: body.phoneNumber, excluded: body.excluded ? 1 : 0 })
    .where(eq(pushSubscriptions.id, body.id));
    
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, Number(id)));
  return NextResponse.json({ ok: true });
}
