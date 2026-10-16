import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (Number.isNaN(recipeId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body: Payload = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    await db
      .update(recipes)
      .set({
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
      .where(eq(recipes.id, recipeId));

    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
    await db.delete(instructions).where(eq(instructions.recipeId, recipeId));

    if (body.ingredients?.length) {
      await db.insert(ingredients).values(
        body.ingredients
          .filter((i) => i.name?.trim())
          .map((i) => ({
            recipeId,
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
            recipeId,
            stepNumber: idx + 1,
            text: s.text.trim(),
          }))
      );
    }

    return NextResponse.json({ id: recipeId });
  } catch (err) {
    console.error("Update recipe error:", err);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (Number.isNaN(recipeId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await db.delete(recipes).where(eq(recipes.id, recipeId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete recipe error:", err);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
