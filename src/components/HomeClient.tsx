"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { t, pick } from "@/lib/i18n";
import { cuisineFlag } from "@/lib/cuisine-flag";

type RecipeRow = {
  id: number;
  name: string;
  nameAr: string | null;
  cuisine: string | null;
  cuisineAr: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string | null;
  dietaryTags: string | null;
};

const TAG_AR: Record<string, string> = {
  Vegetarian: "نباتي", Vegan: "نباتي صرف", "Gluten-Free": "خالٍ من الغلوتين",
  "Dairy-Free": "خالٍ من الألبان", "Nut-Free": "خالٍ من المكسرات",
  Halal: "حلال", Kosher: "كوشير", "Low-Carb": "قليل الكربوهيدرات",
  Keto: "كيتو", Paleo: "باليو", Spicy: "حار", Quick: "سريع",
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
          <Link href="/recipes/new" className="btn btn-primary">{t(lang, "home_empty_cta")}</Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((r) => {
            const tags: string[] = r.dietaryTags ? JSON.parse(r.dietaryTags) : [];
            const displayName = pick(lang, r.name, r.nameAr);
            const displayCuisine = pick(lang, r.cuisine, r.cuisineAr);
            const flag = cuisineFlag(r.cuisine) || cuisineFlag(r.cuisineAr);

            return (
              <Link key={r.id} href={`/recipes/${r.id}`} className="recipe-card">
                <div className="recipe-card-img-wrap">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={displayName} className="recipe-card-img" />
                  ) : (
                    <div className="recipe-card-img" />
                  )}
                  {flag && (
                    <span className="recipe-card-flag" title={displayCuisine}>
                      {flag}
                    </span>
                  )}
                </div>
                <div className="recipe-card-body">
                  <div className="recipe-card-title-row">
                    <h3>{displayName}</h3>
                    {displayCuisine && (
                      <span className="recipe-card-cuisine">
                        {flag && <span className="recipe-card-cuisine-flag">{flag}</span>}
                        {displayCuisine}
                      </span>
                    )}
                  </div>
                  <div className="recipe-card-meta">
                    <span>⏱ {r.prepTime + r.cookTime} {lang === "ar" ? "د" : "min"}</span>
                    <span>🍽 {r.servings}</span>
                  </div>
                  {tags.length > 0 && (
                    <div className="recipe-card-tags">
                      {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="chip">
                          {lang === "ar" ? TAG_AR[tag] ?? tag : tag}
                        </span>
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
