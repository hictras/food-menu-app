export const dynamic = "force-dynamic";
// src/app/recipes/[id]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import RecipeDetailClient from "@/components/RecipeDetailClient";
import { isAdmin } from "@/lib/auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://food-menu-app-xet2.onrender.com";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    return { title: "Recipe not found" };
  }

  const db = getDb();
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, numericId))
    .limit(1);

  if (!recipe) return { title: "Recipe not found" };

  return {
    title: recipe.name,
    description: recipe.description || undefined,
    openGraph: {
      title: recipe.name,
      description: recipe.description || undefined,
      url: `${BASE_URL}/recipes/${recipe.id}`,
      siteName: "Menu — your cookbook",
      type: "article",
    },
  };
}

async function RecipeDetail({ id }: { id: number }) {
  const db = getDb();

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe) notFound();

  const ings = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, id))
    .orderBy(asc(ingredients.id));
  const steps = await db
    .select()
    .from(instructions)
    .where(eq(instructions.recipeId, id))
    .orderBy(asc(instructions.stepNumber));
  const admin = await isAdmin();

  return (
    <RecipeDetailClient
      recipe={recipe}
      ingredients={ings}
      instructions={steps}
      isAdmin={admin}
    />
  );
}

function DetailSkeleton() {
  return (
    <>
      <div
        className="detail-hero"
        style={{ background: "#e8e2d8", opacity: 0.5 }}
      />
      <div
        style={{
          height: 40,
          background: "#e8e2d8",
          margin: "24px 0",
          borderRadius: 8,
          width: "60%",
        }}
      />
    </>
  );
}

async function RecipeResolver({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();
  return <RecipeDetail id={numericId} />;
}

export default function RecipePage({ params }: PageProps) {
  return (
    <main className="container">
      <Suspense fallback={<DetailSkeleton />}>
        <RecipeResolver params={params} />
      </Suspense>
    </main>
  );
}