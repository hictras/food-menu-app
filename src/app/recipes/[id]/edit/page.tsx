import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import RecipeForm from "@/components/RecipeForm";
import EditRecipeShell from "@/components/EditRecipeShell";
import { isAdmin } from "@/lib/auth";

async function AuthGate({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");
  return <>{children}</>;
}

async function EditLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();

  const db = getDb();
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, numericId)).limit(1);
  if (!recipe) notFound();

  const ings = await db.select().from(ingredients).where(eq(ingredients.recipeId, numericId)).orderBy(asc(ingredients.id));
  const steps = await db.select().from(instructions).where(eq(instructions.recipeId, numericId)).orderBy(asc(instructions.stepNumber));

  return (
    <RecipeForm
      initial={{
        id: recipe.id,
        name: recipe.name,
        nameAr: recipe.nameAr,
        description: recipe.description,
        descriptionAr: recipe.descriptionAr,
        cuisine: recipe.cuisine,
        cuisineAr: recipe.cuisineAr,
        category: recipe.category,
        categoryAr: recipe.categoryAr,
        servedWith: recipe.servedWith,
        servedWithAr: recipe.servedWithAr,
        howToServe: recipe.howToServe,
        howToServeAr: recipe.howToServeAr,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        dietaryTags: recipe.dietaryTags,
        imageUrl: recipe.imageUrl,
        videoUrl: recipe.videoUrl,
        ingredients: ings.map((i) => ({
          name: i.name, nameAr: i.nameAr, amount: i.amount, unit: i.unit,
          unitAr: i.unitAr, preparation: i.preparation, preparationAr: i.preparationAr,
        })),
        instructions: steps.map((s) => ({ text: s.text, textAr: s.textAr })),
      }}
    />
  );
}

function FormSkeleton() {
  return <div className="form-card" style={{ height: 400, opacity: 0.4 }} />;
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="container">
      <EditRecipeShell>
        <Suspense fallback={<FormSkeleton />}>
          <AuthGate>
            <EditLoader params={params} />
          </AuthGate>
        </Suspense>
      </EditRecipeShell>
    </main>
  );
}
