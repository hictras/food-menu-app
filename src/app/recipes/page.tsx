import { Suspense } from "react";
import { connection } from "next/server";
import { getDb } from "@/db";
import { recipes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import HomeClient from "@/components/HomeClient";
import Spinner from "@/components/Spinner";
import { isAdmin } from "@/lib/auth";

async function RecipeList() {
  await connection();
  const db = getDb();
  const admin = await isAdmin();
  const all = admin
    ? await db.select().from(recipes).orderBy(desc(recipes.createdAt))
    : await db.select().from(recipes).where(eq(recipes.isHidden, 0)).orderBy(desc(recipes.createdAt));
  return <HomeClient recipes={all} />;
}


export default function RecipesPage() {
  return (
    <main className="container">
      <Suspense fallback={<Spinner />}>
        <RecipeList />
      </Suspense>
    </main>
  );
}
