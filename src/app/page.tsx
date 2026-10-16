import Link from "next/link";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes } from "@/db/schema";
import { desc } from "drizzle-orm";

async function RecipeList() {
const db = getDb();
  const all = await db.select().from(recipes).orderBy(desc(recipes.createdAt));

  if (all.length === 0) {
    return (
      <div className="empty">
        <h2>No recipes yet</h2>
        <p>Start your cookbook by adding your first recipe.</p>
        <Link href="/recipes/new" className="btn btn-primary">
          + Add your first recipe
        </Link>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {all.map((r) => {
        const tags: string[] = r.dietaryTags ? JSON.parse(r.dietaryTags) : [];
        return (
          <Link key={r.id} href={`/recipes/${r.id}`} className="recipe-card">
            {r.imageUrl ? (
              <img src={r.imageUrl} alt={r.name} className="recipe-card-img" />
            ) : (
              <div className="recipe-card-img" />
            )}
            <div className="recipe-card-body">
              <h3>{r.name}</h3>
              <div className="recipe-card-meta">
                <span>⏱ {r.prepTime + r.cookTime} min</span>
                <span>🍽 {r.servings}</span>
              </div>
              {tags.length > 0 && (
                <div className="recipe-card-tags">
                  {tags.slice(0, 3).map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function RecipeSkeleton() {
  return (
    <div className="recipe-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="recipe-card" style={{ opacity: 0.4 }}>
          <div className="recipe-card-img" style={{ background: "#e8e2d8" }} />
          <div className="recipe-card-body">
            <div
              style={{
                height: 18,
                background: "#e8e2d8",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 14,
                background: "#e8e2d8",
                borderRadius: 4,
                width: "60%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="container">
      <div className="page-head">
        <h1>Your Cookbook</h1>
      </div>
      <p className="page-sub">All your saved recipes</p>

      <Suspense fallback={<RecipeSkeleton />}>
        <RecipeList />
      </Suspense>
    </main>
  );
}
