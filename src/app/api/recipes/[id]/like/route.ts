import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { recipeLikes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (Number.isNaN(recipeId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const visitorId = (req.nextUrl.searchParams.get("visitorId") || "").trim();
    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();

    const db = getDb();
    const rows = await db.select().from(recipeLikes).where(eq(recipeLikes.recipeId, recipeId));

    const liked =
      (visitorId && rows.some((r) => r.visitorId === visitorId)) ||
      (phone && rows.some((r) => r.phone === phone)) ||
      false;

    return NextResponse.json({ count: rows.length, liked: !!liked });
  } catch (err) {
    console.error("GET like error:", err);
    return NextResponse.json({ error: "Failed to load likes" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (Number.isNaN(recipeId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const visitorId = (body.visitorId || "").trim();
    if (!visitorId) return NextResponse.json({ error: "visitorId required" }, { status: 400 });

    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim() || null;

    const db = getDb();

    if (phone) {
      const byPhone = await db
        .select()
        .from(recipeLikes)
        .where(and(eq(recipeLikes.recipeId, recipeId), eq(recipeLikes.phone, phone)))
        .limit(1);
      if (byPhone.length > 0 && byPhone[0].visitorId !== visitorId) {
        await db.delete(recipeLikes).where(eq(recipeLikes.id, byPhone[0].id));
      }
    }

    const existing = await db
      .select()
      .from(recipeLikes)
      .where(and(eq(recipeLikes.recipeId, recipeId), eq(recipeLikes.visitorId, visitorId)))
      .limit(1);

    let liked: boolean;
    if (existing.length > 0) {
      await db.delete(recipeLikes).where(eq(recipeLikes.id, existing[0].id));
      liked = false;
    } else {
      await db.insert(recipeLikes).values({ recipeId, visitorId, phone });
      liked = true;
    }

    const rows = await db.select().from(recipeLikes).where(eq(recipeLikes.recipeId, recipeId));
    return NextResponse.json({ count: rows.length, liked });
  } catch (err) {
    console.error("POST like error:", err);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
