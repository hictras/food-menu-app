import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

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

  const tags: string[] = recipe.dietaryTags
    ? JSON.parse(recipe.dietaryTags)
    : [];

  return (
    <>
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="detail-hero"
        />
      )}

      <header className="detail-head">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <h1 style={{ margin: 0 }}>{recipe.name}</h1>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="btn btn-ghost"
          >
            ✎ Edit
          </Link>
        </div>
        {recipe.description && (
          <p className="detail-desc">{recipe.description}</p>
        )}

        <div className="detail-meta">
          <div className="meta-item">
            <span className="meta-label">Prep</span>
            <span className="meta-value">{recipe.prepTime} min</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Cook</span>
            <span className="meta-value">{recipe.cookTime} min</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total</span>
            <span className="meta-value">
              {recipe.prepTime + recipe.cookTime} min
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Serves</span>
            <span className="meta-value">{recipe.servings}</span>
          </div>
          {recipe.cuisine && (
            <div className="meta-item">
              <span className="meta-label">Cuisine</span>
              <span className="meta-value">{recipe.cuisine}</span>
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="chips" style={{ marginTop: 16 }}>
            {tags.map((t) => (
              <span key={t} className="chip active">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="detail-cols">
        <section className="detail-section">
          <h2>Ingredients</h2>
          {ings.length === 0 ? (
            <p className="helper">No ingredients listed.</p>
          ) : (
            <ul className="ing-list">
              {ings.map((i) => (
                <li key={i.id}>
                  <span className="ing-amount">
                    {[i.amount, i.unit].filter(Boolean).join(" ")}
                  </span>
                  <span className="ing-name">
                    {i.name}
                    {i.preparation && (
                      <span
                        style={{
                          color: "var(--muted)",
                          fontStyle: "italic",
                        }}
                      >
                        , {i.preparation}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <h2>Instructions</h2>
          {steps.length === 0 ? (
            <p className="helper">No instructions yet.</p>
          ) : (
            <ol className="steps-list">
              {steps.map((s) => (
                <li key={s.id}>
                  <div className="step-num">{s.stepNumber}</div>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
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

async function RecipeResolver({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();
  return <RecipeDetail id={numericId} />;
}

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="container">
      <div style={{ margin: "24px 0" }}>
        <Link href="/" className="btn btn-ghost">
          ← Back to cookbook
        </Link>
      </div>

      <Suspense fallback={<DetailSkeleton />}>
        <RecipeResolver params={params} />
      </Suspense>
    </main>
  );
}
