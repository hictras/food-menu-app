import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const admin = await isAdmin();
    
    // If admin, get all. If public, only get visible.
    const all = admin
      ? await db.select().from(recipes).orderBy(desc(recipes.createdAt))
      : await db.select().from(recipes).where(eq(recipes.isHidden, 0)).orderBy(desc(recipes.createdAt));

    const allIngredients = await db.select().from(ingredients);
    
    const recipesWithIngredients = all.map((r) => ({
      ...r,
      ingredients: allIngredients.filter((i) => i.recipeId === r.id),
    }));
    
    return NextResponse.json(recipesWithIngredients);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
