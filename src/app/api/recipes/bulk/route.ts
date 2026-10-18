import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

type BulkRecipe = {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  cuisine?: string;
  cuisineAr?: string;
  category?: string;
  categoryAr?: string;
  servedWith?: string;
  servedWithAr?: string;
  howToServe?: string;
  howToServeAr?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  dietaryTags?: string[];
  imageUrl?: string | null;
  videoUrl?: string | null;
  ingredients?: {
    name: string;
    nameAr?: string;
    amount?: string;
    unit?: string;
    unitAr?: string;
    preparation?: string;
    preparationAr?: string;
  }[];
  instructions?: { text: string; textAr?: string }[];
};

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  try {
    const body = await req.json();
    const list: BulkRecipe[] = Array.isArray(body) ? body : body.recipes;

    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json({ error: "Expected non-empty array" }, { status: 400 });
    }

    const ids: number[] = [];

    for (const r of list) {
      if (!r.name?.trim() && !r.nameAr?.trim()) continue;

      const [inserted] = await db
        .insert(recipes)
        .values({
          name: r.name?.trim() || r.nameAr?.trim() || "",
          nameAr: r.nameAr?.trim() || null,
          description: r.description?.trim() || null,
          descriptionAr: r.descriptionAr?.trim() || null,
          cuisine: r.cuisine?.trim() || null,
          cuisineAr: r.cuisineAr?.trim() || null,
          category: r.category?.trim() || null,
          categoryAr: r.categoryAr?.trim() || null,
          servedWith: r.servedWith?.trim() || null,
          servedWithAr: r.servedWithAr?.trim() || null,
          howToServe: r.howToServe?.trim() || null,
          howToServeAr: r.howToServeAr?.trim() || null,
          prepTime: Number(r.prepTime) || 0,
          cookTime: Number(r.cookTime) || 0,
          servings: Number(r.servings) || 4,
          dietaryTags: JSON.stringify(r.dietaryTags ?? []),
          imageUrl: r.imageUrl ?? null,
          videoUrl: r.videoUrl ?? null,
        })
        .returning();

      if (r.ingredients?.length) {
        await db.insert(ingredients).values(
          r.ingredients
            .filter((i) => i.name?.trim() || i.nameAr?.trim())
            .map((i) => ({
              recipeId: inserted.id,
              name: i.name?.trim() || i.nameAr?.trim() || "",
              nameAr: i.nameAr?.trim() || null,
              amount: i.amount?.trim() || null,
              unit: i.unit?.trim() || null,
              unitAr: i.unitAr?.trim() || null,
              preparation: i.preparation?.trim() || null,
              preparationAr: i.preparationAr?.trim() || null,
            }))
        );
      }

      if (r.instructions?.length) {
        await db.insert(instructions).values(
          r.instructions
            .filter((s) => s.text?.trim() || s.textAr?.trim())
            .map((s, idx) => ({
              recipeId: inserted.id,
              stepNumber: idx + 1,
              text: s.text?.trim() || s.textAr?.trim() || "",
              textAr: s.textAr?.trim() || null,
            }))
        );
      }

      ids.push(inserted.id);
    }

    return NextResponse.json({ inserted: ids.length, ids });
  } catch (err) {
    console.error("Bulk import error:", err);
    return NextResponse.json(
      { error: "Bulk import failed: " + String(err) },
      { status: 500 }
    );
  }
}
