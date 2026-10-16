import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";

type Payload = {
  name: string;
  description: string;
  cuisine: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  ingredients: {
    name: string;
    amount: string;
    unit: string;
    preparation: string;
  }[];
  instructions: { text: string }[];
};

export async function POST(req: NextRequest) {
  const db = getDb();
  try {
    const body: Payload = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    const [recipe] = await db
      .insert(recipes)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        cuisine: body.cuisine?.trim() || null,
        prepTime: Number(body.prepTime) || 0,
        cookTime: Number(body.cookTime) || 0,
        servings: Number(body.servings) || 1,
        dietaryTags: JSON.stringify(body.dietaryTags ?? []),
        imageUrl: body.imageUrl ?? null,
        videoUrl: body.videoUrl ?? null,
      })
      .returning();

    if (body.ingredients?.length) {
      await db.insert(ingredients).values(
        body.ingredients
          .filter((i) => i.name?.trim())
          .map((i) => ({
            recipeId: recipe.id,
            name: i.name.trim(),
            amount: i.amount?.trim() || null,
            unit: i.unit?.trim() || null,
            preparation: i.preparation?.trim() || null,
          }))
      );
    }

    if (body.instructions?.length) {
      await db.insert(instructions).values(
        body.instructions
          .filter((s) => s.text?.trim())
          .map((s, idx) => ({
            recipeId: recipe.id,
            stepNumber: idx + 1,
            text: s.text.trim(),
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
