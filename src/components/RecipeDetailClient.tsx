"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";
import { t, pick } from "@/lib/i18n";
import { extractYouTubeId } from "@/lib/youtube";
import { categoryIcon, categoryLabel } from "@/lib/categories";
import CookMode from "./CookMode";
import RecipeReviews from "./RecipeReviews";
import { useModal } from "./ModalProvider";

import { getRecipeImage } from "@/lib/get-recipe-image";
type RecipeRow = {
  id: number; name: string; nameAr: string | null;
  description: string | null; descriptionAr: string | null;
  cuisine: string | null; cuisineAr: string | null;
  category: string | null; categoryAr: string | null;
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

export default function RecipeDetailClient({
  recipe, ingredients, instructions, isAdmin,
  lastMadeDate
}: {
  recipe: RecipeRow;
  ingredients: IngredientRow[];
  instructions: InstructionRow[];
  isAdmin: boolean;
  lastMadeDate?: string | null;
}) {
  const [logoUrl, setLogoUrl] = useState<string>("");
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => { if (d.logo_url) setLogoUrl(d.logo_url); }).catch(() => {});
  }, []);

  const { lang } = useLang();
  const isAr = lang === "ar";
  const L: "ar" | "en" = isAr ? "ar" : "en";
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const formattedLastMade = lastMadeDate ? lastMadeDate.split("-").reverse().join("-") : null;
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const { show, confirm } = useModal();

  let tags: string[] = [];
  try {
    if (recipe.dietaryTags) {
      const parsed = JSON.parse(recipe.dietaryTags);
      if (Array.isArray(parsed)) {
        tags = Array.from(new Set(parsed));
      }
    }
  } catch (e) {
    tags = [];
  }
  const youtubeId = extractYouTubeId(recipe.videoUrl);
  const minLabel = isAr ? ar.units.min : "min";

  const displayName = typeof recipe.name === "string" 
  ? pick(lang, recipe.name, recipe.nameAr) 
  : recipe.name;
  const displayDesc = pick(lang, recipe.description, recipe.descriptionAr);
  const displayCuisine = pick(lang, recipe.cuisine, recipe.cuisineAr);
  const displayServedWith = pick(lang, recipe.servedWith, recipe.servedWithAr);
  const displayHowToServe = pick(lang, recipe.howToServe, recipe.howToServeAr);
  const catIcon = categoryIcon(recipe.category) || categoryIcon(recipe.categoryAr);
  const catLabel = categoryLabel(recipe.category, lang) || categoryLabel(recipe.categoryAr, lang);

  function shareToWhatsApp(withToday: boolean) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/recipes/${recipe.id}${withToday ? "?today" : ""}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(waUrl, "_blank");
  }

  async function handleDelete() {
    const ok = await confirm({
      message: ar.messages.deleteConfirm[L],
      confirmText: isAr ? "حذف" : "Delete",
      tone: "danger"
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      show({ message: ar.messages.deleteFailed[L], tone: "danger" });
      setDeleting(false);
    }
  }

  return (
    <>
      <div style={{ margin: "20px 0" }}>
        <Link href="/recipes" className="btn btn-ghost">{t(lang, "back_cookbook")}</Link>
      </div>

      {getRecipeImage(recipe) && (
        <div className="img-with-watermark">
          <img src={getRecipeImage(recipe)!} alt={displayName} className="detail-hero" loading="eager" decoding="async" />
          {logoUrl && <img src={logoUrl} alt="" className="watermark" style={{ width: 48, height: 48, bottom: 16, right: 16 }} />}
        </div>
      )}

      <header className="detail-head" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
          <h1 style={{ margin: 0, fontSize: 36, fontFamily: "var(--font-head)", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayName}
          </h1>
          <button type="button" className="btn btn-ghost" onClick={() => shareToWhatsApp(false)} style={{ height: 42, padding: "0 16px", borderRadius: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", cursor: "pointer", flexShrink: 0 }}>
            💬 {isAr ? ar.share : "Share"}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          
          {lastMadeDate && (
            <Link 
              href={`/recipes/${recipe.id}/history`} 
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface-2)", border: "1px solid var(--line-strong)", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none", whiteSpace: "nowrap", height: 42, boxSizing: "border-box" }}
            >
              🕒 {isAr ? ar.history.lastTimeMade : "Last time made:"} <strong>{formattedLastMade}</strong>
            </Link>
          )}

          <div style={{ display: "flex", gap: 8, marginInlineStart: "auto" }}>
            {isAdmin && (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => shareToWhatsApp(true)} style={{ height: 42, padding: "0 16px", borderRadius: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", cursor: "pointer" }}>
                  ✨ {isAr ? ar.today : "Today"}
                </button>
                <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-ghost" style={{ height: 42, padding: "0 16px", borderRadius: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", textDecoration: "none" }}>
                  {t(lang, "edit")}
                </Link>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting} style={{ height: 42, padding: "0 16px", borderRadius: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid rgba(255, 107, 74, 0.4)", background: "transparent", color: "var(--accent)", cursor: "pointer" }}>
                  {deleting ? "…" : "🗑"}
                </button>
              </>
            )}

            {instructions.length > 0 && (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setCookModeOpen(true)}
                style={{ height: 42, padding: "0 16px", borderRadius: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--bg)", cursor: "pointer" }}
              >
                🍳 {isAr ? ar.cookMode.start : "Start Cooking"}
              </button>
            )}
          </div>
        </div>
      </header>

      {displayDesc && (
        <>
          <div className="detail-desc-divider" />
          <p className="detail-desc">{displayDesc}</p>
        </>
      )}

      {recipe.videoUrl && (
        <section className="video-section">
          <h2>{t(lang, "video")}</h2>
          {youtubeId ? (
            <div className="video-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Recipe video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              src={recipe.videoUrl}
              controls
              preload="metadata"
              playsInline
              style={{
                width: "100%",
                borderRadius: "var(--radius)",
                border: "1px solid var(--line)",
                background: "#000",
                aspectRatio: "16 / 9",
                objectFit: "contain",
              }}
            />
          )}
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
                          {isAr ? ar.units.comma : ", "}{ingPrep}
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

      <RecipeReviews recipeId={recipe.id} isAdmin={isAdmin} />

      <CookMode
        open={cookModeOpen}
        onClose={() => setCookModeOpen(false)}
        recipeName={displayName}
        steps={instructions}
      />
    </>
  );
}
