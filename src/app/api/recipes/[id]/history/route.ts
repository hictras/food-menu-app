import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { mealPlan } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    
    if (Number.isNaN(recipeId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const db = getDb();
    
    // Fetch all meal plan entries for this recipe, newest first
    const history = await db
      .select({
        id: mealPlan.id,
        date: mealPlan.date,
        slot: mealPlan.slot,
      })
      .from(mealPlan)
      .where(eq(mealPlan.recipeId, recipeId))
      .orderBy(desc(mealPlan.date));

    return NextResponse.json(history);
  } catch (err) {
    console.error("GET recipe history error:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
