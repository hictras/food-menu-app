import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/recipes
 *   - Admin:  returns ALL recipes (including hidden)
 *   - Public: returns only visible recipes (isHidden = 0)
 *   Each recipe includes its `ingredients` array.
 */
export async function GET() {
  try {
    const db = getDb();
    const admin = await isAdmin();

    const all = admin
      ? await db.select().from(recipes).orderBy(desc(recipes.createdAt))
      : await db
          .select()
          .from(recipes)
          .where(eq(recipes.isHidden, 0))
          .orderBy(desc(recipes.createdAt));

    const allIngredients = await db.select().from(ingredients);

    const recipesWithIngredients = all.map((r) => ({
      ...r,
      ingredients: allIngredients.filter((i) => i.recipeId === r.id),
    }));

    return NextResponse.json(recipesWithIngredients);
  } catch (err) {
    console.error("GET recipes error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/**
 * POST /api/recipes
 *   Admin only. Creates a new recipe with ingredients + instructions.
 *   Body shape matches RecipeForm.tsx.
 */
type Payload = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  cuisine: string;
  cuisineAr: string;
  category: string;
  categoryAr: string;
  servedWith: string;
  servedWithAr: string;
  howToServe: string;
  howToServeAr: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  ingredients: {
    name: string;
    nameAr: string;
    amount: string;
    unit: string;
    unitAr: string;
    preparation: string;
    preparationAr: string;
  }[];
  instructions: { text: string; textAr: string }[];
};

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  try {
    const body: Payload = await req.json();

    if (!body.name?.trim() && !body.nameAr?.trim()) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    const [recipe] = await db
      .insert(recipes)
      .values({
        name: body.name?.trim() || body.nameAr?.trim() || "",
        nameAr: body.nameAr?.trim() || null,
        description: body.description?.trim() || null,
        descriptionAr: body.descriptionAr?.trim() || null,
        cuisine: body.cuisine?.trim() || null,
        cuisineAr: body.cuisineAr?.trim() || null,
        category: body.category?.trim() || null,
        categoryAr: body.categoryAr?.trim() || null,
        servedWith: body.servedWith?.trim() || null,
        servedWithAr: body.servedWithAr?.trim() || null,
        howToServe: body.howToServe?.trim() || null,
        howToServeAr: body.howToServeAr?.trim() || null,
        prepTime: Number(body.prepTime) || 0,
        cookTime: Number(body.cookTime) || 0,
        servings: Number(body.servings) || 1,
        dietaryTags: JSON.stringify(
          Array.from(new Set(body.dietaryTags ?? []))
        ),
        imageUrl: body.imageUrl ?? null,
        videoUrl: body.videoUrl ?? null,
      })
      .returning();

    if (body.ingredients?.length) {
      await db.insert(ingredients).values(
        body.ingredients
          .filter((i) => i.name?.trim() || i.nameAr?.trim())
          .map((i) => ({
            recipeId: recipe.id,
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

    if (body.instructions?.length) {
      await db.insert(instructions).values(
        body.instructions
          .filter((s) => s.text?.trim() || s.textAr?.trim())
          .map((s, idx) => ({
            recipeId: recipe.id,
            stepNumber: idx + 1,
            text: s.text?.trim() || s.textAr?.trim() || "",
            textAr: s.textAr?.trim() || null,
          }))
      );
    }

    return NextResponse.json({ id: recipe.id });
  } catch (err) {
    console.error("Save recipe error:", err);
    return NextResponse.json(
      { error: "Failed to save recipe" },
      { status: 500 }
    );
  }
}
