import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import RecipeForm from "@/components/RecipeForm";

async function EditLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();

  const db = getDb();
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, numericId))
    .limit(1);

  if (!recipe) notFound();

  const ings = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, numericId))
    .orderBy(asc(ingredients.id));

  const steps = await db
    .select()
    .from(instructions)
    .where(eq(instructions.recipeId, numericId))
    .orderBy(asc(instructions.stepNumber));

  return (
    <RecipeForm
      initial={{
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        cuisine: recipe.cuisine,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        dietaryTags: recipe.dietaryTags,
        imageUrl: recipe.imageUrl,
        videoUrl: recipe.videoUrl,
        ingredients: ings.map((i) => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          preparation: i.preparation,
        })),
        instructions: steps.map((s) => ({ text: s.text })),
      }}
    />
  );
}

function FormSkeleton() {
  return <div className="form-card" style={{ height: 400, opacity: 0.4 }} />;
}

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="container">
      <div style={{ margin: "24px 0" }}>
        <Link href="/" className="btn btn-ghost">
          ← Back
        </Link>
      </div>
      <div className="page-head">
        <h1>Edit Recipe</h1>
      </div>
      <p className="page-sub">Update any field and save.</p>

      <Suspense fallback={<FormSkeleton />}>
        <EditLoader params={params} />
      </Suspense>
    </main>
  );
}
