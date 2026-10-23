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
    const reviews = await db
      .select({
        id: recipeReviews.id,
        rating: recipeReviews.rating,
        comment: recipeReviews.comment,
        phone: recipeReviews.phone,
        updatedAt: recipeReviews.updatedAt,
        name: pushSubscriptions.name,
      })
      .from(recipeReviews)
      .leftJoin(pushSubscriptions, eq(recipeReviews.phone, pushSubscriptions.phoneNumber))
      .where(eq(recipeReviews.recipeId, recipeId))
      .orderBy(desc(recipeReviews.updatedAt));

    const store = await cookies();
    const viewerPhone = (store.get(VIEWER_PHONE_COOKIE)?.value || "").trim();

    let mine = null;
    if (viewerPhone) {
      const myReview = reviews.find((r) => r.phone === viewerPhone);
      if (myReview) mine = { rating: myReview.rating, comment: myReview.comment };
    }

    const total = reviews.length;
    const average = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;

    const publicReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      updatedAt: r.updatedAt,
      name: r.name || null,
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
    
    // If there is no phone cookie, we cannot verify who is submitting.
    if (!phone) return NextResponse.json({ error: "Verify your phone to rate." }, { status: 401 });

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = (body.comment || "").trim() || null;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const db = getDb();
    
    // Check if this specific user already reviewed this specific recipe
    const existing = await db
      .select()
      .from(recipeReviews)
      .where(and(eq(recipeReviews.recipeId, recipeId), eq(recipeReviews.phone, phone)))
      .limit(1);

    if (existing.length > 0) {
      // Update ONLY the row that belongs to this phone and recipe
      await db
        .update(recipeReviews)
        .set({ rating, comment, updatedAt: new Date().toISOString() })
        .where(eq(recipeReviews.id, existing[0].id)); // Using the unique ID of the found review
    } else {
      // Insert new review
      await db.insert(recipeReviews).values({
        recipeId,
        phone,
        rating,
        comment,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST review error:", err);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
