import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { recipeReviews, pushSubscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (Number.isNaN(recipeId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();

    const reviewRows = await db
      .select({
        id: recipeReviews.id,
        rating: recipeReviews.rating,
        comment: recipeReviews.comment,
        phone: recipeReviews.phone,
        updatedAt: recipeReviews.updatedAt,
      })
      .from(recipeReviews)
      .where(eq(recipeReviews.recipeId, recipeId))
      .orderBy(desc(recipeReviews.updatedAt));

    const subs = await db
      .select({ phoneNumber: pushSubscriptions.phoneNumber, name: pushSubscriptions.name })
      .from(pushSubscriptions);

    const nameByPhone = new Map<string, string | null>();
    for (const s of subs) {
      if (!s.phoneNumber) continue;
      if (!nameByPhone.has(s.phoneNumber)) {
        nameByPhone.set(s.phoneNumber, s.name);
      } else if (!nameByPhone.get(s.phoneNumber) && s.name) {
        nameByPhone.set(s.phoneNumber, s.name);
      }
    }

    const store = await cookies();
    const viewerPhone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();

    let mine = null;
    if (viewerPhone) {
      const myReview = reviewRows.find((r) => r.phone === viewerPhone);
      if (myReview) mine = { rating: myReview.rating, comment: myReview.comment };
    }

    const total = reviewRows.length;
    const average =
      total > 0 ? reviewRows.reduce((acc, r) => acc + r.rating, 0) / total : 0;

    const publicReviews = reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      updatedAt: r.updatedAt,
      name: nameByPhone.get(r.phone) || null,
    }));

    return NextResponse.json({ average, count: total, mine, reviews: publicReviews });
  } catch (err) {
    console.error("GET reviews error:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
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

    const store = await cookies();
    const phone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();
    if (!phone) return NextResponse.json({ error: "Verify your phone to rate." }, { status: 401 });

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = (body.comment || "").trim() || null;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db
      .select()
      .from(recipeReviews)
      .where(and(eq(recipeReviews.recipeId, recipeId), eq(recipeReviews.phone, phone)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(recipeReviews)
        .set({ rating, comment, updatedAt: new Date().toISOString() })
        .where(eq(recipeReviews.id, existing[0].id));
    } else {
      await db.insert(recipeReviews).values({ recipeId, phone, rating, comment });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST review error:", err);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reviewId = Number(req.nextUrl.searchParams.get("reviewId"));
    const db = getDb();
    await db.delete(recipeReviews).where(eq(recipeReviews.id, reviewId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE review error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
