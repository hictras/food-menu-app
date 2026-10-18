import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import RecipeDetailClient from "@/components/RecipeDetailClient";
import { isAdmin } from "@/lib/auth";
import type { Metadata } from "next";

// --- Meta Tags for WhatsApp/Facebook Preview ---
export async function generateMetadata({ 
  params, 
  searchParams 
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

  // 1. Check if ?today is in the URL
  const isToday = "today" in search;
  const title = isToday ? `Hicham's Main Dish of the day - ${recipe.name}` : recipe.name;
  
  const description = recipe.description || "View this recipe on Menu.";
  const image = recipe.imageUrl || "https://food-menu-app-xxww.onrender.com/icon-192.png";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [{ url: image }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [image],
    },
  };
}

// --- Detail Page Logic ---
async function RecipeDetail({ 
  id, 
  isToday 
}: { 
  id: number; 
  isToday: boolean;
}) {
  const db = getDb();
  
  // Fetch the recipe
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe) notFound();

  // Override the name if ?today is present using JSX
  const displayRecipe = isToday 
    ? { 
        ...recipe, 
        name: (
          <>
            Hicham's Main Dish of the day
            <br />
            <span style={{ fontSize: "0.75em", fontWeight: 400, color: "var(--muted)", display: "block", marginTop: 8 }}>
              {recipe.name}
            </span>
          </>
        ) 
      } 
    : recipe;

  const ings = await db.select().from(ingredients).where(eq(ingredients.recipeId, id)).orderBy(asc(ingredients.id));
  const steps = await db.select().from(instructions).where(eq(instructions.recipeId, id)).orderBy(asc(instructions.stepNumber));
  const admin = await isAdmin();

  return (
    <RecipeDetailClient
      // We pass the overridden name as a ReactNode
      recipe={displayRecipe as any}
      ingredients={ings}
      instructions={steps}
      isAdmin={admin}
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

async function RecipeResolver({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();
  
  return <RecipeDetail id={numericId} isToday={"today" in search} />;
}

export default function RecipePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <main className="container">
      <Suspense fallback={<DetailSkeleton />}>
        <RecipeResolver params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
