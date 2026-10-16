import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import RecipeDetailClient from "@/components/RecipeDetailClient";

async function RecipeDetail({ id }: { id: number }) {
  const db = getDb();

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe) notFound();

  const ings = await db.select().from(ingredients).where(eq(ingredients.recipeId, id)).orderBy(asc(ingredients.id));
  const steps = await db.select().from(instructions).where(eq(instructions.recipeId, id)).orderBy(asc(instructions.stepNumber));

  return <RecipeDetailClient recipe={recipe} ingredients={ings} instructions={steps} />;
}

function DetailSkeleton() {
  return (
    <>
      <div className="detail-hero" style={{ background: "#e8e2d8", opacity: 0.5 }} />
      <div style={{ height: 40, background: "#e8e2d8", margin: "24px 0", borderRadius: 8, width: "60%" }} />
    </>
  );
}

async function RecipeResolver({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();
  return <RecipeDetail id={numericId} />;
}

export default function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="container">
      <Suspense fallback={<DetailSkeleton />}>
        <RecipeResolver params={params} />
      </Suspense>
    </main>
  );
}
