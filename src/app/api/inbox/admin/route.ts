import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications, notificationReads, pushSubscriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb();
    const all = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
    const reads = await db.select().from(notificationReads);
    const subs = await db.select().from(pushSubscriptions);

    const nameByPhone = new Map<string, string | null>();
    for (const s of subs) {
      if (!nameByPhone.has(s.phoneNumber)) nameByPhone.set(s.phoneNumber, s.name);
    }

    const readersByNotif = new Map<number, { name: string | null; phone: string }[]>();
    for (const r of reads) {
      if (!readersByNotif.has(r.notificationId)) readersByNotif.set(r.notificationId, []);
      readersByNotif.get(r.notificationId)!.push({
        name: nameByPhone.get(r.phone) || null,
        phone: r.phone,
      });
    }

    const result = all.map((n) => ({
      id: n.id,
      title: n.title,
      createdAt: n.createdAt,
      readers: readersByNotif.get(n.id) || [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Admin inbox error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
