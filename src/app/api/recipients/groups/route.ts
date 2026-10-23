import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipientGroups, recipientGroupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const groups = await db.select().from(recipientGroups);
  const members = await db.select().from(recipientGroupMembers);
  
  const result = groups.map(g => ({
    ...g,
    phones: members.filter(m => m.groupId === g.id).map(m => m.phone)
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const { name, phones } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const [group] = await db.insert(recipientGroups).values({ name }).returning();
  
  if (phones && phones.length > 0) {
    await db.insert(recipientGroupMembers).values(
      phones.map((phone: string) => ({ groupId: group.id, phone }))
    );
  }
  return NextResponse.json(group);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const id = Number(req.nextUrl.searchParams.get("id"));
  await db.delete(recipientGroups).where(eq(recipientGroups.id, id));
  return NextResponse.json({ ok: true });
}
