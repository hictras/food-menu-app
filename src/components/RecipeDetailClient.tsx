"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "./LanguageProvider";
import { t, pick } from "@/lib/i18n";
import { extractYouTubeId } from "@/lib/youtube";

type RecipeRow = {
  id: number; name: string; nameAr: string | null;
  description: string | null; descriptionAr: string | null;
  cuisine: string | null; cuisineAr: string | null;
  servedWith: string | null; servedWithAr: string | null;
  howToServe: string | null; howToServeAr: string | null;
  prepTime: number; cookTime: number; servings: number;
  dietaryTags: string | null; imageUrl: string | null; videoUrl: string | null;
};
type IngredientRow = {
  id: number; name: string; nameAr: string | null;
  amount: string | null; unit: string | null; unitAr: string | null;
  preparation: string | null; preparationAr: string | null;
};
type InstructionRow = { id: number; stepNumber: number; text: string; textAr: string | null };

const TAG_AR: Record<string, string> = {
  Vegetarian: "نباتي", Vegan: "نباتي صرف", "Gluten-Free": "خالٍ من الغلوتين",
  "Dairy-Free": "خالٍ من الألبان", "Nut-Free": "خالٍ من المكسرات",
  Halal: "حلال", Kosher: "كوشير", "Low-Carb": "قليل الكربوهيدرات",
  Keto: "كيتو", Paleo: "باليو", Spicy: "حار", Quick: "سريع",
};

export default function RecipeDetailClient({
  recipe, ingredients, instructions, isAdmin,
}: {
  recipe: RecipeRow;
  ingredients: IngredientRow[];
  instructions: InstructionRow[];
  isAdmin: boolean;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const tags: string[] = recipe.dietaryTags ? JSON.parse(recipe.dietaryTags) : [];
  const youtubeId = extractYouTubeId(recipe.videoUrl);
  const minLabel = lang === "ar" ? "د" : "min";

  const displayName = pick(lang, recipe.name, recipe.nameAr);
  const displayDesc = pick(lang, recipe.description, recipe.descriptionAr);
  const displayCuisine = pick(lang, recipe.cuisine, recipe.cuisineAr);
  const displayServedWith = pick(lang, recipe.servedWith, recipe.servedWithAr);
  const displayHowToServe = pick(lang, recipe.howToServe, recipe.howToServeAr);

  async function shareWhatsApp() {
    try {
      const res = await fetch(`/api/share/whatsapp?id=${recipe.id}&lang=${lang}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Share failed:", err);
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      lang === "ar"
        ? `هل أنت متأكد من حذف "${displayName}"؟ لا يمكن التراجع.`
        : `Delete "${displayName}"? This cannot be undone.`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      // Use router to preserve theme + language state
      router.push("/");
      router.refresh();
    } catch (err) {
      alert(lang === "ar" ? "فشل الحذف" : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <>
      <div style={{ margin: "20px 0" }}>
        <Link href="/" className="btn btn-ghost">{t(lang, "back_cookbook")}</Link>
      </div>

      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={displayName} className="detail-hero" />
      )}

      <header className="detail-head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{displayName}</h1>

          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={shareWhatsApp}
              title={lang === "ar" ? "مشاركة عبر واتساب" : "Share on WhatsApp"}
            >
              💬 {lang === "ar" ? "مشاركة" : "Share"}
            </button>

            {isAdmin && (
              <>
                <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-ghost">
                  {t(lang, "edit")}
                </Link>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "…" : lang === "ar" ? "🗑 حذف" : "🗑 Delete"}
                </button>
              </>
            )}
          </div>
        </div>

        {displayDesc && <p className="detail-desc">{displayDesc}</p>}

        <div className="detail-meta">
          <div className="meta-item"><span className="meta-label">{t(lang, "prep")}</span><span className="meta-value">{recipe.prepTime} {minLabel}</span></div>
          <div className="meta-item"><span className="meta-label">{t(lang, "cook")}</span><span className="meta-value">{recipe.cookTime} {minLabel}</span></div>
          <div className="meta-item"><span className="meta-label">{t(lang, "min_total")}</span><span className="meta-value">{recipe.prepTime + recipe.cookTime} {minLabel}</span></div>
          <div className="meta-item"><span className="meta-label">{t(lang, "servings")}</span><span className="meta-value">{recipe.servings}</span></div>
          {displayCuisine && (
            <div className="meta-item"><span className="meta-label">{t(lang, "cuisine")}</span><span className="meta-value">{displayCuisine}</span></div>
          )}
        </div>

        {displayServedWith && (
          <div className="serve-note">
            <div className="serve-label">{lang === "ar" ? "يقدم مع" : "Served with"}</div>
            <div className="serve-value">{displayServedWith}</div>
          </div>
        )}

        {displayHowToServe && (
          <div className="serve-note">
            <div className="serve-label">{lang === "ar" ? "طريقة التقديم" : "How to serve"}</div>
            <div className="serve-value">{displayHowToServe}</div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="chips" style={{ marginTop: 16 }}>
            {tags.map((tag) => (
              <span key={tag} className="chip active">{lang === "ar" ? TAG_AR[tag] ?? tag : tag}</span>
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
              {ingredients.map((i) => {
                const ingName = pick(lang, i.name, i.nameAr);
                const ingUnit = pick(lang, i.unit, i.unitAr);
                const ingPrep = pick(lang, i.preparation, i.preparationAr);
                return (
                  <li key={i.id}>
                    <span className="ing-amount">{[i.amount, ingUnit].filter(Boolean).join(" ")}</span>
                    <span className="ing-name">
                      {ingName}
                      {ingPrep && (
                        <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                          {lang === "ar" ? "، " : ", "}{ingPrep}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
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
                  <p>{pick(lang, s.text, s.textAr)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
