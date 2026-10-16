"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";

type RecipeRow = {
  id: number;
  name: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string | null;
  dietaryTags: string | null;
};

export default function HomeClient({ recipes }: { recipes: RecipeRow[] }) {
  const { lang } = useLang();
  const count = recipes.length;

  return (
    <>
      <div className="page-head">
        <h1>{t(lang, "home_title")}</h1>
      </div>
      <p className="page-sub">
        {count === 0
          ? ""
          : count === 1
          ? t(lang, "recipe_count_one")
          : t(lang, "recipe_count").replace("{n}", String(count))}
      </p>

      {count === 0 ? (
        <div className="empty">
          <h2>{t(lang, "home_empty_title")}</h2>
          <p>{t(lang, "home_empty_text")}</p>
          <Link href="/recipes/new" className="btn btn-primary">
            {t(lang, "home_empty_cta")}
          </Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((r) => {
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
                    <span>⏱ {r.prepTime + r.cookTime} {lang === "ar" ? "د" : "min"}</span>
                    <span>🍽 {r.servings}</span>
                  </div>
                  {tags.length > 0 && (
                    <div className="recipe-card-tags">
                      {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="chip">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
