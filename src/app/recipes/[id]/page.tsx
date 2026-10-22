import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes, ingredients, instructions, settings, mealPlan } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import RecipeDetailClient from "@/components/RecipeDetailClient";
import { isAdmin } from "@/lib/auth";
import type { Metadata } from "next";

export async function generateMetadata({ 
  params, searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { id } = await params;
  const search = await searchParams;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return { title: "Recipe Not Found" };

  const db = getDb();
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, numericId)).limit(1);
  if (!recipe) return { title: "Recipe Not Found" };

  const settingsRows = await db.select().from(settings);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  const isToday = "today" in search;
  const customTitle = s.today_text || "Hicham's Main Dish of the day";
  
  const title = isToday ? `${customTitle} - ${recipe.name}` : recipe.name;
  const description = recipe.description || "View this recipe on Menu.";
  const image = recipe.imageUrl || "https://food-menu-app-xxww.onrender.com/icon-192.png";

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image }], type: "article" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function RecipeDetail({ id, isToday }: { id: number; isToday: boolean; }) {
  const db = getDb();
  
  const settingsRows = await db.select().from(settings);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe) notFound();

  const customTitle = s.today_text || "Hicham's Main Dish of the day";

  const displayRecipe = isToday 
    ? { 
        ...recipe, 
        name: (
          <>
            <span 
              className="custom-color-text"
              style={{ 
                "--custom-light": s.today_color_light || "#e2543a",
                "--custom-dark": s.today_color_dark || "#ff6b4a"
              } as React.CSSProperties}
            >
              {customTitle}
            </span>
            <br />
            <span 
              className="custom-color-text"
              style={{ 
                "--custom-light": s.recipe_name_color_light || "#52525b",
                "--custom-dark": s.recipe_name_color_dark || "#a1a1aa",
                fontSize: "0.75em", 
                fontWeight: 400, 
                display: "block", 
                marginTop: 8 
              } as React.CSSProperties}
            >
              {recipe.name}
            </span>
          </>
        ) 
      } 
    : recipe;

  const history = await db.select({ date: mealPlan.date }).from(mealPlan).where(eq(mealPlan.recipeId, id)).orderBy(desc(mealPlan.date)).limit(1);
  const lastMadeDate = history.length > 0 ? history[0].date : null;

  const ings = await db.select().from(ingredients).where(eq(ingredients.recipeId, id)).orderBy(asc(ingredients.id));
  const steps = await db.select().from(instructions).where(eq(instructions.recipeId, id)).orderBy(asc(instructions.stepNumber));
  const admin = await isAdmin();

  return (
    <RecipeDetailClient
      recipe={displayRecipe as any}
      ingredients={ings}
      instructions={steps}
      isAdmin={admin}
      lastMadeDate={lastMadeDate}
    />
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="detail-hero" style={{ background: "#e8e2d8", opacity: 0.5 }} />
      <div style={{ height: 40, background: "#e8e2d8", margin: "24px 0", borderRadius: 8, width: "60%" }} />
    </>
  );
}

async function RecipeResolver({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }>; }) {
  const { id } = await params;
  const search = await searchParams;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();
  return <RecipeDetail id={numericId} isToday={"today" in search} />;
}

export default function RecipePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }>; }) {
  return (
    <main className="container">
      <Suspense fallback={<DetailSkeleton />}>
        <RecipeResolver params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
