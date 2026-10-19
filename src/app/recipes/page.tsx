import { connection } from "next/server";
import { getDb } from "@/db";
import { recipes } from "@/db/schema";
import { desc } from "drizzle-orm";
import HomeClient from "@/components/HomeClient";

async function RecipeList() {
  await connection();
  const db = getDb();
  const all = await db.select().from(recipes).orderBy(desc(recipes.createdAt));
  return <HomeClient recipes={all} />;
}

export default function RecipesPage() {
  return (
    <main className="container">
      <RecipeList />
    </main>
  );
}
