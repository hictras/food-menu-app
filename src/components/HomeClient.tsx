"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang } from "./LanguageProvider";
import { t, pick } from "@/lib/i18n";
import { cuisineFlagUrl } from "@/lib/cuisine-flag";
import { CATEGORIES } from "@/lib/categories";

type RecipeRow = {
  id: number;
  name: string;
  nameAr: string | null;
  cuisine: string | null;
  cuisineAr: string | null;
  category: string | null;
  categoryAr: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string | null;
  videoUrl: string | null;
  dietaryTags: string | null;
};

const TAG_AR: Record<string, string> = {
  Vegetarian: "نباتي", Vegan: "نباتي صرف", Pescatarian: "بيسكاتاري",
  "Gluten-Free": "خالٍ من الغلوتين", "Dairy-Free": "خالٍ من الألبان",
  "Nut-Free": "خالٍ من المكسرات", Halal: "حلال", Kosher: "كوشير",
  "Low-Carb": "قليل الكربوهيدرات", Keto: "كيتو", Paleo: "باليو",
  Meat: "لحوم", Chicken: "دجاج", Seafood: "مأكولات بحرية",
  Fish: "سمك", Lamb: "لحم غنم", Beef: "لحم بقري",
  Legumes: "بقوليات", Spicy: "حار", Quick: "سريع",
};

type SortKey = "newest" | "name-asc" | "name-desc" | "time-asc" | "time-desc";

export default function HomeClient({ recipes }: { recipes: RecipeRow[] }) {
  const { lang } = useLang();

  const [query, setQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("newest");

  const allCuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      if (r.cuisine) set.add(r.cuisine);
      if (r.cuisineAr && !r.cuisine) set.add(r.cuisineAr);
    }
    return Array.from(set).sort();
  }, [recipes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      if (!r.dietaryTags) continue;
      try {
        const tags = JSON.parse(r.dietaryTags);
        if (Array.isArray(tags)) tags.forEach((tag) => set.add(tag));
      } catch {}
    }
    return Array.from(set).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = recipes.filter((r) => {
      const name = (pick(lang, r.name, r.nameAr) || "").toLowerCase();
      const cuisine = (pick(lang, r.cuisine, r.cuisineAr) || "").toLowerCase();

      if (q && !name.includes(q) && !cuisine.includes(q)) return false;
      if (cuisineFilter && (r.cuisine || r.cuisineAr) !== cuisineFilter) return false;
      if (categoryFilter && (r.category || r.categoryAr) !== categoryFilter) return false;

      if (tagFilter) {
        if (!r.dietaryTags) return false;
        try {
          const tags = JSON.parse(r.dietaryTags);
          if (!Array.isArray(tags) || !tags.includes(tagFilter)) return false;
        } catch {
          return false;
        }
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name-asc") return (pick(lang, a.name, a.nameAr) || "").localeCompare(pick(lang, b.name, b.nameAr) || "");
      if (sort === "name-desc") return (pick(lang, b.name, b.nameAr) || "").localeCompare(pick(lang, a.name, a.nameAr) || "");
      if (sort === "time-asc") return a.prepTime + a.cookTime - (b.prepTime + b.cookTime);
      if (sort === "time-desc") return b.prepTime + b.cookTime - (a.prepTime + a.cookTime);
      return 0;
    });

    return list;
  }, [recipes, query, cuisineFilter, categoryFilter, tagFilter, sort, lang]);

  const grouped = useMemo(() => {
    const groups: { key: string; icon: string; label: string; items: RecipeRow[] }[] = [];

    for (const c of CATEGORIES) {
      const items = filtered.filter(
        (r) =>
          (r.category || "") === c.value ||
          (r.categoryAr || "") === c.valueAr ||
          (r.category || "") === c.valueAr ||
          (r.categoryAr || "") === c.value
      );
      if (items.length > 0) {
        groups.push({
          key: c.value,
          icon: c.icon,
          label: lang === "ar" ? c.valueAr : c.value,
          items,
        });
      }
    }

    const uncategorized = filtered.filter((r) => {
      const cat = (r.category || "").trim();
      const catAr = (r.categoryAr || "").trim();
      if (!cat && !catAr) return true;
      return !CATEGORIES.some(
        (c) =>
          c.value === cat ||
          c.valueAr === cat ||
          c.value === catAr ||
          c.valueAr === catAr
      );
    });

    if (uncategorized.length > 0) {
      groups.push({
        key: "__other__",
        icon: "🍴",
        label: lang === "ar" ? "أخرى" : "Other",
        items: uncategorized,
      });
    }

    return groups;
  }, [filtered, lang]);

  const hasFilters = query || cuisineFilter || categoryFilter || tagFilter;
  const total = recipes.length;

  function clearFilters() {
    setQuery("");
    setCuisineFilter("");
    setCategoryFilter("");
    setTagFilter("");
    setSort("newest");
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1>{t(lang, "home_title")}</h1>
      </div>
      <p className="page-sub">
        {total === 0
          ? ""
          : hasFilters
          ? lang === "ar"
            ? `${filtered.length} من ${total} وصفة`
            : `${filtered.length} of ${total} recipes`
          : total === 1
          ? t(lang, "recipe_count_one")
          : t(lang, "recipe_count").replace("{n}", String(total))}
      </p>

      {total > 0 && (
        <div className="filter-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder={lang === "ar" ? "ابحث عن وصفة..." : "Search recipes..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
            )}
          </div>

          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{lang === "ar" ? "كل الفئات" : "All categories"}</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {lang === "ar" ? c.valueAr : c.value}</option>
            ))}
          </select>

          <select className="filter-select" value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
            <option value="">{lang === "ar" ? "كل المطابخ" : "All cuisines"}</option>
            {allCuisines.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select className="filter-select" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">{lang === "ar" ? "كل الوسوم" : "All tags"}</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{lang === "ar" ? TAG_AR[tag] ?? tag : tag}</option>
            ))}
          </select>

          <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
            <option value="name-asc">{lang === "ar" ? "الاسم أ-ي" : "Name A–Z"}</option>
            <option value="name-desc">{lang === "ar" ? "الاسم ي-أ" : "Name Z–A"}</option>
            <option value="time-asc">{lang === "ar" ? "الأسرع أولاً" : "Fastest first"}</option>
            <option value="time-desc">{lang === "ar" ? "الأطول أولاً" : "Longest first"}</option>
          </select>

          {hasFilters && (
            <button type="button" className="filter-clear" onClick={clearFilters}>{lang === "ar" ? "مسح" : "Clear"}</button>
          )}
        </div>
      )}

      {total === 0 ? (
        <div className="empty">
          <h2>{t(lang, "home_empty_title")}</h2>
          <p>{t(lang, "home_empty_text")}</p>
          <Link href="/recipes/new" className="btn btn-primary">{t(lang, "home_empty_cta")}</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <h2>{lang === "ar" ? "لا نتائج" : "No results"}</h2>
          <p>{lang === "ar" ? "جرّب كلمات أخرى أو امسح الفلاتر." : "Try different keywords or clear your filters."}</p>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>{lang === "ar" ? "مسح الفلاتر" : "Clear filters"}</button>
        </div>
      ) : (
        <div className="category-sections">
          {grouped.map((group) => (
            <section key={group.key} className="category-section">
              <div className="category-section-head">
                <h2 className="category-section-title">
                  <span className="category-section-icon">{group.icon}</span>
                  <span>{group.label}</span>
                </h2>
                <span className="category-section-count">{group.items.length}</span>
              </div>
              <div className="category-section-line" />
              <div className="recipe-grid">
                {group.items.map((r) => {
                  const tags: string[] = r.dietaryTags ? JSON.parse(r.dietaryTags) : [];
                  const displayName = pick(lang, r.name, r.nameAr);
                  const displayCuisine = pick(lang, r.cuisine, r.cuisineAr);
                  const flagUrl = cuisineFlagUrl(r.cuisine) || cuisineFlagUrl(r.cuisineAr);
                  const hasVideo = !!(r.videoUrl && r.videoUrl.trim());

                  return (
                    <Link key={r.id} href={`/recipes/${r.id}`} className="recipe-card">
                      <div className="recipe-card-img-wrap">
                        {r.imageUrl ? (
                          <img src={r.imageUrl} alt={displayName} className="recipe-card-img" loading="lazy" decoding="async" />
                        ) : (
                          <div className="recipe-card-img" />
                        )}
                        {hasVideo && (
                          <span
                            className="recipe-card-video-emoji"
                            title={lang === "ar" ? "يحتوي على فيديو" : "Has video"}
                          >
                            🎬
                          </span>
                        )}
                      </div>

                      <div className="recipe-card-body">
                        <div className="recipe-card-head">
                          <div className="recipe-card-text">
                            <h3>{displayName}</h3>
                            {displayCuisine && (
                              <span className="recipe-card-cuisine">{displayCuisine}</span>
                            )}
                          </div>
                          {flagUrl && (
                            <img src={flagUrl} alt={displayCuisine} className="recipe-card-flag" loading="lazy" />
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
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
