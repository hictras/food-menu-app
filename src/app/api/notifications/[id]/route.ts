import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await db.delete(notifications).where(eq(notifications.id, numericId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
