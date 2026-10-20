import { Suspense } from "react";
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

function RecipeSkeleton() {
  return (
    <div className="recipe-grid" style={{ opacity: 0.4, marginTop: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="recipe-card">
          <div className="recipe-card-img" style={{ background: "var(--line)" }} />
          <div className="recipe-card-body">
            <div style={{ height: 18, background: "var(--line)", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 14, background: "var(--line)", borderRadius: 4, width: "60%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <main className="container">
      <Suspense fallback={<RecipeSkeleton />}>
        <RecipeList />
      </Suspense>
    </main>
  );
}
