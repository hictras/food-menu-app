import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const admin = await isAdmin();

    const list = admin
      ? await db.select().from(notifications).orderBy(desc(notifications.createdAt))
      : await db
          .select()
          .from(notifications)
          .where(eq(notifications.targetPhone, "all"))
          .orderBy(desc(notifications.createdAt));

    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
