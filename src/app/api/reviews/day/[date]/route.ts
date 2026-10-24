import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { dayReviews, pushSubscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const VIEWER_PHONE_COOKIE = "viewer_phone";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const db = getDb();

    const reviewRows = await db
      .select({
        id: dayReviews.id,
        rating: dayReviews.rating,
        comment: dayReviews.comment,
        phone: dayReviews.phone,
        updatedAt: dayReviews.updatedAt,
      })
      .from(dayReviews)
      .where(eq(dayReviews.date, date))
      .orderBy(desc(dayReviews.updatedAt));

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
    console.error("GET day reviews error:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

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
      .from(dayReviews)
      .where(and(eq(dayReviews.date, date), eq(dayReviews.phone, phone)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(dayReviews)
        .set({ rating, comment, updatedAt: new Date().toISOString() })
        .where(eq(dayReviews.id, existing[0].id));
    } else {
      await db.insert(dayReviews).values({ date, phone, rating, comment });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST day review error:", err);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const reviewId = Number(req.nextUrl.searchParams.get("reviewId"));
    const db = getDb();
    await db.delete(dayReviews).where(eq(dayReviews.id, reviewId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE day review error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
