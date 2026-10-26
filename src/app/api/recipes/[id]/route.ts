import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

type Payload = {
  name?: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  cuisine?: string | null;
  cuisineAr?: string | null;
  category?: string | null;
  categoryAr?: string | null;
  servedWith?: string | null;
  servedWithAr?: string | null;
  howToServe?: string | null;
  howToServeAr?: string | null;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  dietaryTags?: string[];
  imageUrl?: string | null;
  image1Url?: string | null;
  image2Url?: string | null;
  useImage2?: boolean | null;
  videoUrl?: string | null;
  isHidden?: number;
  ingredients?: {
    name: string;
    nameAr?: string | null;
    amount?: string | null;
    unit?: string | null;
    unitAr?: string | null;
    preparation?: string | null;
    preparationAr?: string | null;
  }[];
  instructions?: { text: string; textAr?: string | null }[];
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (Number.isNaN(recipeId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body: Payload = await req.json();
    if (!body.name?.trim() && !body.nameAr?.trim()) return NextResponse.json({ error: "Recipe name is required" }, { status: 400 });

    // Fetch existing recipe to use as fallback for any missing fields
    const existingRows = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
    if (!existingRows[0]) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    const existing = existingRows[0];

    // Swap active image if useImage2 is explicitly provided
    if (body.useImage2 === true && body.image2Url) { body.imageUrl = body.image2Url; }
    if (body.useImage2 === false && body.image1Url) { body.imageUrl = body.image1Url; }

    // Update only the fields that were provided in the request. Keep existing values otherwise.
    await db.update(recipes).set({
      name: body.name !== undefined ? (body.name?.trim() || body.nameAr?.trim() || "") : existing.name,
      nameAr: body.nameAr !== undefined ? (body.nameAr?.trim() || null) : existing.nameAr,
      description: body.description !== undefined ? (body.description?.trim() || null) : existing.description,
      descriptionAr: body.descriptionAr !== undefined ? (body.descriptionAr?.trim() || null) : existing.descriptionAr,
      cuisine: body.cuisine !== undefined ? (body.cuisine?.trim() || null) : existing.cuisine,
      cuisineAr: body.cuisineAr !== undefined ? (body.cuisineAr?.trim() || null) : existing.cuisineAr,
      category: body.category !== undefined ? (body.category?.trim() || null) : existing.category,
      categoryAr: body.categoryAr !== undefined ? (body.categoryAr?.trim() || null) : existing.categoryAr,
      servedWith: body.servedWith !== undefined ? (body.servedWith?.trim() || null) : existing.servedWith,
      servedWithAr: body.servedWithAr !== undefined ? (body.servedWithAr?.trim() || null) : existing.servedWithAr,
      howToServe: body.howToServe !== undefined ? (body.howToServe?.trim() || null) : existing.howToServe,
      howToServeAr: body.howToServeAr !== undefined ? (body.howToServeAr?.trim() || null) : existing.howToServeAr,
      prepTime: body.prepTime !== undefined ? (Number(body.prepTime) || 0) : existing.prepTime,
      cookTime: body.cookTime !== undefined ? (Number(body.cookTime) || 0) : existing.cookTime,
      servings: body.servings !== undefined ? (Number(body.servings) || 1) : existing.servings,
      dietaryTags: body.dietaryTags !== undefined ? JSON.stringify(body.dietaryTags ?? []) : existing.dietaryTags,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
      image1Url: body.image1Url !== undefined ? body.image1Url : existing.image1Url,
      image2Url: body.image2Url !== undefined ? body.image2Url : existing.image2Url,
      useImage2: body.useImage2 !== undefined ? body.useImage2 : existing.useImage2,
      videoUrl: body.videoUrl !== undefined ? (body.videoUrl ?? null) : existing.videoUrl,
      isHidden: body.isHidden !== undefined ? body.isHidden : existing.isHidden,
    }).where(eq(recipes.id, recipeId));

    // Only update ingredients if they were provided
    if (body.ingredients !== undefined) {
      await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
      if (body.ingredients?.length) {
        await db.insert(ingredients).values(
          body.ingredients
            .filter((i) => i.name?.trim() || i.nameAr?.trim())
            .map((i) => ({
              recipeId,
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
    }

    // Only update instructions if they were provided
    if (body.instructions !== undefined) {
      await db.delete(instructions).where(eq(instructions.recipeId, recipeId));
      if (body.instructions?.length) {
        await db.insert(instructions).values(
          body.instructions
            .filter((s) => s.text?.trim() || s.textAr?.trim())
            .map((s, idx) => ({
              recipeId,
              stepNumber: idx + 1,
              text: s.text?.trim() || s.textAr?.trim() || "",
              textAr: s.textAr?.trim() || null,
            }))
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update recipe error:", err);
    return NextResponse.json({ error: "Failed to update: " + String(err) }, { status: 500 });
  }
}
