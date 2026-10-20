import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { mealPlan, recipes } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

/**
 * GET /api/meal-plan?month=2026-10
 *   Returns: [{ date, slot, recipe: { id, name, nameAr, imageUrl, category, categoryAr } }]
 *
 * POST /api/meal-plan
 *   Body: { date, slot, recipeId }
 *   Upserts one slot for one day.
 *
 * DELETE /api/meal-plan?date=2026-10-20&slot=dinner
 *   Removes one slot.
 */

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const month = req.nextUrl.searchParams.get("month"); // "2026-10"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month=YYYY-MM required" }, { status: 400 });
    }

    const from = month + "-01";
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const to = month + "-" + String(lastDay).padStart(2, "0");

    const rows = await db
      .select()
      .from(mealPlan)
      .where(and(gte(mealPlan.date, from), lte(mealPlan.date, to)));

    if (rows.length === 0) return NextResponse.json([]);

    const recipeIds = Array.from(new Set(rows.map((r) => r.recipeId)));
    const recipeRows = await db.select().from(recipes);
    const recipeMap = new Map<number, typeof recipes.$inferSelect>();
    for (const r of recipeRows) recipeMap.set(r.id, r);

    const result = rows
      .map((row) => {
        const recipe = recipeMap.get(row.recipeId);
        if (!recipe) return null;
        return {
          date: row.date,
          slot: row.slot,
          recipe: {
            id: recipe.id,
            name: recipe.name,
            nameAr: recipe.nameAr,
            imageUrl: recipe.imageUrl,
            category: recipe.category,
            categoryAr: recipe.categoryAr,
          },
        };
      })
      .filter((x) => x !== null);

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET meal-plan error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { date, slot, recipeId } = body || {};

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date=YYYY-MM-DD required" }, { status: 400 });
    }
    if (!slot || typeof slot !== "string") {
      return NextResponse.json({ error: "slot required" }, { status: 400 });
    }
    const rid = Number(recipeId);
    if (!rid || Number.isNaN(rid)) {
      return NextResponse.json({ error: "recipeId required" }, { status: 400 });
    }

    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, rid)).limit(1);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Upsert: try to find existing row for (date, slot)
    const existing = await db
      .select()
      .from(mealPlan)
      .where(and(eq(mealPlan.date, date), eq(mealPlan.slot, slot)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(mealPlan)
        .set({ recipeId: rid })
        .where(eq(mealPlan.id, existing[0].id));
    } else {
      await db.insert(mealPlan).values({
        date,
        slot,
        recipeId: rid,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST meal-plan error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const date = req.nextUrl.searchParams.get("date");
    const slot = req.nextUrl.searchParams.get("slot");

    if (!date || !slot) {
      return NextResponse.json({ error: "date and slot required" }, { status: 400 });
    }

    await db
      .delete(mealPlan)
      .where(and(eq(mealPlan.date, date), eq(mealPlan.slot, slot)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE meal-plan error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
