import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { mealPlan, recipes } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

/**
 * GET /api/meal-plan?month=YYYY-MM
 *   Returns: [{ date, slot, position, recipe: { id, name, nameAr, imageUrl, category, categoryAr } }]
 *
 * POST /api/meal-plan
 *   Body: { date, slot, position, recipeId }
 *   Upserts one slot+position for one day. Position must be 1 or 2.
 *
 * DELETE /api/meal-plan?id=N
 *   Removes one row by id.
 */

const VALID_SLOTS = ["breakfast", "lunch", "dinner", "snack", "dessert"];
const MAX_POSITIONS = 2;

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const month = req.nextUrl.searchParams.get("month");
    const dateParam = req.nextUrl.searchParams.get("date");

    // Day mode: ?date=YYYY-MM-DD
    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json({ error: "date=YYYY-MM-DD required" }, { status: 400 });
      }
      const dayRows = await db.select().from(mealPlan).where(eq(mealPlan.date, dateParam));
      if (dayRows.length === 0) return NextResponse.json([]);
      const dayRecipeRows = await db.select().from(recipes);
      const dayRecipeMap = new Map<number, typeof recipes.$inferSelect>();
      for (const r of dayRecipeRows) dayRecipeMap.set(r.id, r);
      const dayResult = dayRows
        .map((row) => {
          const recipe = dayRecipeMap.get(row.recipeId);
          if (!recipe) return null;
          return {
            id: row.id,
            date: row.date,
            slot: row.slot,
            position: row.position,
            recipe: {
              id: recipe.id,
              name: recipe.name,
              nameAr: recipe.nameAr,
              description: recipe.description,
              descriptionAr: recipe.descriptionAr,
              imageUrl: recipe.imageUrl,
              category: recipe.category,
              categoryAr: recipe.categoryAr,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              servings: recipe.servings,
            },
          };
        })
        .filter((x) => x !== null)
        .sort((a, b) => {
          if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
          return a.position - b.position;
        });
      return NextResponse.json(dayResult);
    }

    // Month mode: ?month=YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month=YYYY-MM or date=YYYY-MM-DD required" }, { status: 400 });
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

    const recipeRows = await db.select().from(recipes);
    const recipeMap = new Map<number, typeof recipes.$inferSelect>();
    for (const r of recipeRows) recipeMap.set(r.id, r);

    const result = rows
      .map((row) => {
        const recipe = recipeMap.get(row.recipeId);
        if (!recipe) return null;
        return {
          id: row.id,
          date: row.date,
          slot: row.slot,
          position: row.position,
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
      .filter((x) => x !== null)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
        return a.position - b.position;
      });

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
    const { date, slot, position, recipeId } = body || {};

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date=YYYY-MM-DD required" }, { status: 400 });
    }
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }
    const pos = Number(position);
    if (!pos || pos < 1 || pos > MAX_POSITIONS) {
      return NextResponse.json({ error: "position must be 1 or 2" }, { status: 400 });
    }
    const rid = Number(recipeId);
    if (!rid || Number.isNaN(rid)) {
      return NextResponse.json({ error: "recipeId required" }, { status: 400 });
    }

    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, rid)).limit(1);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Upsert by (date, slot, position)
    const existing = await db
      .select()
      .from(mealPlan)
      .where(
        and(
          eq(mealPlan.date, date),
          eq(mealPlan.slot, slot),
          eq(mealPlan.position, pos)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(mealPlan)
        .set({ recipeId: rid })
        .where(eq(mealPlan.id, existing[0].id));
      return NextResponse.json({ ok: true, id: existing[0].id, updated: true });
    } else {
      const [inserted] = await db.insert(mealPlan).values({
        date,
        slot,
        position: pos,
        recipeId: rid,
      }).returning();
      return NextResponse.json({ ok: true, id: inserted.id, updated: false });
    }
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
    const idParam = req.nextUrl.searchParams.get("id");

    if (!idParam) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await db.delete(mealPlan).where(eq(mealPlan.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE meal-plan error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
