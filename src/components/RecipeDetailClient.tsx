"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";
import { extractYouTubeId } from "@/lib/youtube";

type RecipeRow = {
  id: number;
  name: string;
  description: string | null;
  cuisine: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
};

type IngredientRow = {
  id: number;
  name: string;
  amount: string | null;
  unit: string | null;
  preparation: string | null;
};

type InstructionRow = {
  id: number;
  stepNumber: number;
  text: string;
};

export default function RecipeDetailClient({
  recipe,
  ingredients,
  instructions,
}: {
  recipe: RecipeRow;
  ingredients: IngredientRow[];
  instructions: InstructionRow[];
}) {
  const { lang } = useLang();
  const tags: string[] = recipe.dietaryTags ? JSON.parse(recipe.dietaryTags) : [];
  const youtubeId = extractYouTubeId(recipe.videoUrl);
  const minLabel = lang === "ar" ? "د" : "min";

  return (
    <>
      <div style={{ margin: "24px 0" }}>
        <Link href="/" className="btn btn-ghost">
          {t(lang, "back_cookbook")}
        </Link>
      </div>

      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={recipe.name} className="detail-hero" />
      )}

      <header className="detail-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{recipe.name}</h1>
          <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-ghost">
            {t(lang, "edit")}
          </Link>
        </div>
        {recipe.description && <p className="detail-desc">{recipe.description}</p>}

        <div className="detail-meta">
          <div className="meta-item">
            <span className="meta-label">{t(lang, "prep")}</span>
            <span className="meta-value">{recipe.prepTime} {minLabel}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t(lang, "cook")}</span>
            <span className="meta-value">{recipe.cookTime} {minLabel}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t(lang, "min_total")}</span>
            <span className="meta-value">{recipe.prepTime + recipe.cookTime} {minLabel}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t(lang, "servings")}</span>
            <span className="meta-value">{recipe.servings}</span>
          </div>
          {recipe.cuisine && (
            <div className="meta-item">
              <span className="meta-label">{t(lang, "cuisine")}</span>
              <span className="meta-value">{recipe.cuisine}</span>
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="chips" style={{ marginTop: 16 }}>
            {tags.map((tag) => (
              <span key={tag} className="chip active">{tag}</span>
            ))}
          </div>
        )}
      </header>

      {youtubeId && (
        <section className="video-section">
          <h2>{t(lang, "video")}</h2>
          <div className="video-wrap">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Recipe video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      <div className="detail-cols">
        <section className="detail-section">
          <h2>{t(lang, "ingredients")}</h2>
          {ingredients.length === 0 ? (
            <p className="helper">{t(lang, "no_ingredients")}</p>
          ) : (
            <ul className="ing-list">
              {ingredients.map((i) => (
                <li key={i.id}>
                  <span className="ing-amount">
                    {[i.amount, i.unit].filter(Boolean).join(" ")}
                  </span>
                  <span className="ing-name">
                    {i.name}
                    {i.preparation && (
                      <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                        {lang === "ar" ? "، " : ", "}{i.preparation}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <h2>{t(lang, "instructions")}</h2>
          {instructions.length === 0 ? (
            <p className="helper">{t(lang, "no_instructions")}</p>
          ) : (
            <ol className="steps-list">
              {instructions.map((s) => (
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
