"use client";
import LikeButton from "./LikeButton";

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
import { useCart } from "./CartProvider";

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
  const { addToCart } = useCart();
  const { show, confirm } = useModal();
  
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => { if (d.logo_url) setLogoUrl(d.logo_url); }).catch(() => {});
  }, []);

  const { lang } = useLang();
  const isAr = lang === "ar";
  const L: "ar" | "en" = isAr ? "ar" : "en";
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [matching, setMatching] = useState(false);
  const formattedLastMade = lastMadeDate ? lastMadeDate.split("-").reverse().join("-") : null;
  const [cookModeOpen, setCookModeOpen] = useState(false);

  let tags: string[] = [];
  try {
    if (recipe.dietaryTags) {
      const parsed = JSON.parse(recipe.dietaryTags);
      if (Array.isArray(parsed)) tags = Array.from(new Set(parsed));
    }
  } catch (e) { tags = []; }

  const youtubeId = extractYouTubeId(recipe.videoUrl);
  const displayName = typeof recipe.name === "string" ? pick(lang, recipe.name, recipe.nameAr) : recipe.name;
  const displayDesc = pick(lang, recipe.description, recipe.descriptionAr);

  function shareToWhatsApp(withToday: boolean) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/recipes/${recipe.id}${withToday ? "?today" : ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
  }

  async function handleDelete() {
    const ok = await confirm({ message: ar.messages.deleteConfirm[L], confirmText: isAr ? "حذف" : "Delete", tone: "danger" });
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

  async function handleMatchToStore() {
    if (ingredients.length === 0) return;
    
    setMatching(true);
    try {
      const ingNames = ingredients.map(i => i.name).filter(Boolean);
      
      const res = await fetch("/api/store/match-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingNames }),
      });
      
      const data = await res.json();
      
      if (data.matches && data.matches.length > 0) {
        for (const product of data.matches) {
          addToCart({
            id: product.id,
            title: isAr && product.titleAr ? product.titleAr : product.title,
            price: product.price,
            imageUrl: product.imageUrl,
          });
        }
        
        show({ message: isAr ? `تمت إضافة ${data.matches.length} منتجات إلى السلة!` : `Added ${data.matches.length} items to your cart!`, tone: "info" });
        setTimeout(() => router.push("/cart"), 1000);
      } else {
        show({ message: isAr ? "لم يتم العثور على تطابقات في المتجر." : "No matching products found in the store.", tone: "danger" });
      }
    } catch (err) {
      show({ message: isAr ? "حدث خطأ." : "An error occurred.", tone: "danger" });
    } finally {
      setMatching(false);
    }
  }

  return (
    <>
      <style>{`
        /* ACTION BAR */
        .recipe-actions-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--line);
        }
        .recipe-actions-bar .btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          background: var(--surface);
          border: 1px solid var(--line);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .recipe-actions-bar .btn:hover {
          background: var(--surface-2);
          border-color: var(--line-strong);
        }
        .recipe-actions-bar .btn-danger {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--accent);
        }
        
        /* INGREDIENTS & INSTRUCTIONS HIGH VISIBILITY */
        .detail-section h2 {
          font-size: 20px !important;
          font-weight: 700 !important;
          color: var(--ink) !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          border-bottom: 1px solid var(--line-strong) !important;
          padding-bottom: 12px !important;
          margin-bottom: 16px !important;
          font-family: var(--font-head) !important;
        }

        .ing-list li {
          font-size: 15px !important;
          color: var(--ink) !important;
          padding: 12px 0 !important;
          border-bottom: 1px solid var(--line-strong) !important;
        }
        .ing-amount {
          font-size: 14px !important;
          color: var(--accent) !important;
          font-weight: 700 !important;
          min-width: 70px !important;
        }
        .ing-name {
          font-weight: 500 !important;
        }
        
        .steps-list li p {
          font-size: 15px !important;
          color: var(--ink) !important;
          line-height: 1.7 !important;
          margin-top: 4px !important;
        }
        .step-num {
          background: var(--accent-soft) !important;
          color: var(--accent) !important;
          border: 1px solid var(--accent) !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          width: 28px !important;
          height: 28px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        /* VERTICAL DIVIDER FOR DESKTOP */
        @media (min-width: 721px) {
          .detail-cols {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 48px;
          }
          .detail-cols > section:nth-child(2) {
            border-inline-start: 1px solid var(--line-strong);
            padding-inline-start: 48px;
            /* Offset the border to the center of the gap */
            margin-inline-start: -24px; 
          }
        }
        
        @media (max-width: 640px) {
          .recipe-actions-bar {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            gap: 6px;
          }
          .recipe-actions-bar .btn {
            height: 34px;
            padding: 0 8px;
            font-size: 11.5px;
            flex-shrink: 0;
          }
          .recipe-actions-bar::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div style={{ margin: "20px 0" }}>
        <Link href="/recipes" className="btn btn-ghost">{t(lang, "back_cookbook")}</Link>
      </div>

      {getRecipeImage(recipe) && (
        <div className="img-with-watermark">
          <img src={getRecipeImage(recipe)!} alt={displayName} className="detail-hero" loading="eager" decoding="async" />
        </div>
      )}

      <header className="detail-head" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 36, fontFamily: "var(--font-head)", fontWeight: 400, lineHeight: 1.1, color: "var(--ink)" }}>
            {displayName}
          </h1>
          <LikeButton recipeId={recipe.id} />
        </div>

        <div className="recipe-actions-bar">
            {instructions.length > 0 && (
              <button type="button" className="btn" onClick={() => setCookModeOpen(true)}>
                {isAr ? ar.cookMode.start : "Start Cooking"}
              </button>
            )}
            {ingredients.length > 0 && (
              <button type="button" className="btn" onClick={handleMatchToStore} disabled={matching}>
                🛒 {matching ? (isAr ? "جاري البحث..." : "Searching...") : (isAr ? "قائمة التسوق" : "Shop List")}
              </button>
            )}
            <button type="button" className="btn" onClick={() => shareToWhatsApp(false)}>
              {isAr ? "مشاركة" : "Share"}
            </button>
            {lastMadeDate && (
              <Link href={`/recipes/${recipe.id}/history`} className="btn" style={{ color: "var(--muted)" }}>
                📅 {formattedLastMade}
              </Link>
            )}
            {isAdmin && (
              <>
                <button type="button" className="btn" onClick={() => shareToWhatsApp(true)}>
                  {isAr ? ar.today : "Today"}
                </button>
                <Link href={`/recipes/${recipe.id}/edit`} className="btn">
                  {isAr ? "تعديل" : "Edit"}
                </Link>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "…" : (isAr ? "حذف" : "Delete")}
                </button>
              </>
            )}
        </div>
      </header>

      {displayDesc && (
        <>
          <div className="detail-desc-divider" style={{ background: "var(--line-strong)" }} />
          <p className="detail-desc" style={{ color: "var(--ink-soft)" }}>{displayDesc}</p>
        </>
      )}

      {recipe.videoUrl && (
        <section className="video-section">
          <h2>{t(lang, "video")}</h2>
          {youtubeId ? (
            <div className="video-wrap"><iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="Recipe video" allowFullScreen /></div>
          ) : (
            <video src={recipe.videoUrl} controls preload="metadata" playsInline style={{ width: "100%", borderRadius: "var(--radius)", border: "1px solid var(--line)", background: "#000", aspectRatio: "16 / 9", objectFit: "contain" }} />
          )}
        </section>
      )}

      <div className="detail-cols">
        <section className="detail-section">
          <h2>{t(lang, "ingredients")}</h2>
          {ingredients.length === 0 ? <p className="helper">{t(lang, "no_ingredients")}</p> : (
            <ul className="ing-list">
              {ingredients.map((i) => (
                <li key={i.id}>
                  <span className="ing-amount">{[i.amount, pick(lang, i.unit, i.unitAr)].filter(Boolean).join(" ")}</span>
                  <span className="ing-name">{pick(lang, i.name, i.nameAr)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <h2>{t(lang, "instructions")}</h2>
          {instructions.length === 0 ? <p className="helper">{t(lang, "no_instructions")}</p> : (
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
      <CookMode open={cookModeOpen} onClose={() => setCookModeOpen(false)} recipeName={displayName} steps={instructions} />
    </>
  );
}
