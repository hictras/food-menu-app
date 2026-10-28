"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import PickerDropdown from "./PickerDropdown";
import AutoTranslate from "./AutoTranslate";
import { DIETARY_TAGS } from "@/lib/dietary-tags";
import { parseIngredientsBulk } from "@/lib/parse-ingredients";
import { extractYouTubeId } from "@/lib/youtube";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";
import { CUISINES, UNITS, PREPARATIONS } from "@/lib/pickers";
import { CATEGORIES } from "@/lib/categories";
import VideoUpload from "./VideoUpload";

type Ingredient = {
  name: string; nameAr: string; amount: string; unit: string; unitAr: string;
  preparation: string; preparationAr: string;
};
type Step = { text: string; textAr: string };

type InitialData = {
  id: number;
  name: string; nameAr: string | null;
  description: string | null; descriptionAr: string | null;
  cuisine: string | null; cuisineAr: string | null;
  category: string | null; categoryAr: string | null;
  servedWith: string | null; servedWithAr: string | null;
  howToServe: string | null; howToServeAr: string | null;
  prepTime: number; cookTime: number; servings: number;
  dietaryTags: string | null; imageUrl: string | null;
  image1Url?: string | null;
  image2Url?: string | null;
  useImage2?: boolean | null; videoUrl: string | null;
  ingredients: {
    name: string; nameAr: string | null; amount: string | null;
    unit: string | null; unitAr: string | null;
    preparation: string | null; preparationAr: string | null;
  }[];
  instructions: { text: string; textAr: string | null }[];
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

const emptyIngredient: Ingredient = {
  name: "", nameAr: "", amount: "", unit: "", unitAr: "", preparation: "", preparationAr: "",
};

export default function RecipeForm({ initial }: { initial?: InitialData }) {
  const router = useRouter();
  const { lang } = useLang();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [cuisineAr, setCuisineAr] = useState(initial?.cuisineAr ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [categoryAr, setCategoryAr] = useState(initial?.categoryAr ?? "");
  const [servedWith, setServedWith] = useState(initial?.servedWith ?? "");
  const [servedWithAr, setServedWithAr] = useState(initial?.servedWithAr ?? "");
  const [howToServe, setHowToServe] = useState(initial?.howToServe ?? "");
  const [howToServeAr, setHowToServeAr] = useState(initial?.howToServeAr ?? "");
  const [prepTime, setPrepTime] = useState(initial?.prepTime ? String(initial.prepTime) : "");
  const [cookTime, setCookTime] = useState(initial?.cookTime ? String(initial.cookTime) : "");
  const [servings, setServings] = useState(initial?.servings ? String(initial.servings) : "4");

  const [tags, setTags] = useState<string[]>(() => {
    if (!initial?.dietaryTags) return [];
    try {
      const parsed = typeof initial.dietaryTags === "string" 
        ? JSON.parse(initial.dietaryTags) 
        : initial.dietaryTags;
      
      if (!Array.isArray(parsed)) return [];

      const normalized = parsed.map((t: string) => {
        const officialTag = DIETARY_TAGS.find(
          (official) => official.toLowerCase() === t.toLowerCase().trim()
        );
        return officialTag || t; 
      });

      return Array.from(new Set(normalized));
    } catch (err) { 
      return []; 
    }
  });
  

      

      

      
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [image1Url, setImage1Url] = useState<string | null>(initial?.image1Url ?? null);
  const [image2Url, setImage2Url] = useState<string | null>(initial?.image2Url ?? null);
  const [useImage2, setUseImage2] = useState<boolean>(initial?.useImage2 ?? false);
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");

  

      

  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>(
    initial?.ingredients?.length
      ? initial.ingredients.map((i) => ({
          name: i.name, nameAr: i.nameAr ?? "", amount: i.amount ?? "",
          unit: i.unit ?? "", unitAr: i.unitAr ?? "",
          preparation: i.preparation ?? "", preparationAr: i.preparationAr ?? "",
        }))
      : [{ ...emptyIngredient }]
  );

  const [steps, setSteps] = useState<Step[]>(
    initial?.instructions?.length
      ? initial.instructions.map((s) => ({ text: s.text, textAr: s.textAr ?? "" }))
      : [{ text: "", textAr: "" }]
  );

  const [bulkIngredients, setBulkIngredients] = useState("");
  const [bulkSteps, setBulkSteps] = useState("");
  const [showBulkIng, setShowBulkIng] = useState(false);
  const [showBulkStep, setShowBulkStep] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, isEdit]);

  const totalTime = useMemo(() => (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0), [prepTime, cookTime]);
  const videoPreviewId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);

  function toggleTag(tag: string) {
    setTags((tags) => (tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag]));
    setDirty(true);
  }
  function updateIngredient(i: number, patch: Partial<Ingredient>) {
    setIngredientsList((list) => list.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)));
    setDirty(true);
  }
  function addIngredient() { setIngredientsList((l) => [...l, { ...emptyIngredient }]); setDirty(true); }
  function removeIngredient(i: number) {
    setIngredientsList((l) => (l.length === 1 ? l : l.filter((_, idx) => idx !== i)));
    setDirty(true);
  }
  function applyBulkIngredients() {
    const parsed = parseIngredientsBulk(bulkIngredients);
    if (parsed.length === 0) return;
    setIngredientsList((prev) => {
      const cleaned = prev.filter((i) => i.name.trim() || i.nameAr.trim() || i.amount.trim());
      return [...cleaned, ...parsed.map((p) => ({
        name: p.name, nameAr: "", amount: p.amount, unit: p.unit,
        unitAr: "", preparation: p.preparation, preparationAr: "",
      }))];
    });
    setBulkIngredients("");
    setShowBulkIng(false);
    setDirty(true);
  }
  function updateStep(i: number, patch: Partial<Step>) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
    setDirty(true);
  }
  function addStep() { setSteps((s) => [...s, { text: "", textAr: "" }]); setDirty(true); }
  function removeStep(i: number) {
    setSteps((s) => (s.length === 1 ? s : s.filter((_, idx) => idx !== i)));
    setDirty(true);
  }
  function applyBulkSteps() {
    const lines = bulkSteps.split(/\r?\n/)
      .map((l) => l.replace(/^[\s•·●○▪▫■□◆◇♦→*\-–—]+/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setSteps((prev) => {
      const cleaned = prev.filter((s) => s.text.trim() || s.textAr.trim());
      return [...cleaned, ...lines.map((text) => ({ text, textAr: "" }))];
    });
    setBulkSteps("");
    setShowBulkStep(false);
    setDirty(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() && !nameAr.trim()) { setError(t(lang, "name_required")); return; }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/recipes/${initial!.id}` : "/api/recipes";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || nameAr.trim(), nameAr,
          description, descriptionAr,
          cuisine, cuisineAr,
          category, categoryAr,
          servedWith, servedWithAr,
          howToServe, howToServeAr,
          prepTime: parseInt(prepTime) || 0,
          cookTime: parseInt(cookTime) || 0,
          servings: parseInt(servings) || 1,
          dietaryTags: tags, imageUrl, image1Url, image2Url, useImage2,
          videoUrl: videoUrl.trim() || null,
          ingredients: ingredientsList.filter((i) => i.name.trim() || i.nameAr.trim()),
          instructions: steps.filter((s) => s.text.trim() || s.textAr.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save recipe");
      }

      setDirty(false);
      setToast(isEdit ? t(lang, "recipe_updated") : t(lang, "recipe_saved"));
      router.refresh();
      const dest = isEdit ? `/recipes/${initial!.id}` : "/";
      setTimeout(() => router.push(dest), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const markDirty = () => { if (!dirty) setDirty(true); };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: 13 }}>
          {error}
        </div>
      )}

      <section className="form-section">
        <h2>{t(lang, "basics")}</h2>

        <div className="field-pair">
          <div className="field">
            <label>Recipe name (EN)</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); markDirty(); }} dir="ltr" />
          </div>
          <div className="field">
            <label>اسم الوصفة (AR)</label>
            <input type="text" value={nameAr} onChange={(e) => { setNameAr(e.target.value); markDirty(); }} dir="rtl" />
          </div>
        </div>

        <div className="field-pair">
          <div className="field">
            <label>Description (EN)</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} dir="ltr" />
          </div>
          <div className="field">
            <label>الوصف (AR)</label>
            <textarea value={descriptionAr} onChange={(e) => { setDescriptionAr(e.target.value); markDirty(); }} dir="rtl" />
          </div>
        </div>

        <div className="field-pair">
          <div className="field">
            <label>Cuisine (EN)</label>
            <div className="input-with-tools">
              <input type="text" value={cuisine} onChange={(e) => { setCuisine(e.target.value); markDirty(); }} dir="ltr" />
              <AutoTranslate kind="cuisine" value={cuisine} sourceIsAr={false} onTranslated={(v) => { setCuisineAr(v); markDirty(); }} />
              <PickerDropdown
                items={CUISINES}
                title={lang === "ar" ? "اختر المطبخ" : "Pick cuisine"}
                onPick={(en, ar) => { setCuisine(en); setCuisineAr(ar); markDirty(); }}
              />
            </div>
          </div>
          <div className="field">
            <label>المطبخ (AR)</label>
            <div className="input-with-tools">
              <input type="text" value={cuisineAr} onChange={(e) => { setCuisineAr(e.target.value); markDirty(); }} dir="rtl" />
              <AutoTranslate kind="cuisine" value={cuisineAr} sourceIsAr={true} onTranslated={(v) => { setCuisine(v); markDirty(); }} />
            </div>
          </div>
        </div>

        <div className="field-pair">
          <div className="field">
            <label>Category (EN)</label>
            <div className="input-with-tools">
              <input type="text" value={category} onChange={(e) => { setCategory(e.target.value); markDirty(); }} dir="ltr" placeholder="Main Dish, Stew, Dessert..." />
              <PickerDropdown
                items={CATEGORIES.map((c) => ({
                  value: c.value,
                  valueAr: c.valueAr,
                  label: c.value,
                  icon: c.icon,
                }))}
                title={lang === "ar" ? "اختر الفئة" : "Pick category"}
                onPick={(en, ar) => { setCategory(en); setCategoryAr(ar); markDirty(); }}
              />
            </div>
          </div>
          <div className="field">
            <label>الفئة (AR)</label>
            <input type="text" value={categoryAr} onChange={(e) => { setCategoryAr(e.target.value); markDirty(); }} dir="rtl" />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>{lang === "ar" ? "التقديم" : "Serving"}</h2>

        <div className="field-pair">
          <div className="field">
            <label>Served with (EN)</label>
            <textarea value={servedWith} onChange={(e) => { setServedWith(e.target.value); markDirty(); }} dir="ltr" placeholder="e.g. Fattoush salad and warm Lentil soup" />
          </div>
          <div className="field">
            <label>يقدم مع (AR)</label>
            <textarea value={servedWithAr} onChange={(e) => { setServedWithAr(e.target.value); markDirty(); }} dir="rtl" placeholder="مثال: سلطة فتوش وشوربة عدس" />
          </div>
        </div>

        <div className="field-pair">
          <div className="field">
            <label>How to serve (EN)</label>
            <textarea value={howToServe} onChange={(e) => { setHowToServe(e.target.value); markDirty(); }} dir="ltr" placeholder="e.g. Serve hot in a large platter" />
          </div>
          <div className="field">
            <label>طريقة التقديم (AR)</label>
            <textarea value={howToServeAr} onChange={(e) => { setHowToServeAr(e.target.value); markDirty(); }} dir="rtl" placeholder="مثال: يقدم ساخناً في طبق كبير" />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>
          {t(lang, "time_servings")}
          {totalTime > 0 && <span className="total-time">⏱ {totalTime} {t(lang, "min_total")}</span>}
        </h2>

        <div className="field-row">
          <div className="field">
            <label>{t(lang, "prep")}</label>
            <input type="number" min="0" value={prepTime} onChange={(e) => { setPrepTime(e.target.value); markDirty(); }} />
          </div>
          <div className="field">
            <label>{t(lang, "cook")}</label>
            <input type="number" min="0" value={cookTime} onChange={(e) => { setCookTime(e.target.value); markDirty(); }} />
          </div>
          <div className="field">
            <label>{t(lang, "servings")}</label>
            <input type="number" min="1" value={servings} onChange={(e) => { setServings(e.target.value); markDirty(); }} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>{t(lang, "tags")}</h2>
        <p className="helper" style={{ marginBottom: 14, marginTop: -8 }}>{t(lang, "tags_hint")}</p>
        <div className="chips">
          {DIETARY_TAGS.map((tag) => (
            <button key={tag} type="button" className={`chip${tags.includes(tag) ? " active" : ""}`} onClick={() => toggleTag(tag)}>
              {lang === "ar" ? TAG_AR[tag] ?? tag : tag}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>{t(lang, "photo")}</h2>
        
        {/* ACTIVE IMAGE PREVIEW */}
        <div style={{ marginBottom: 24, padding: 16, background: "var(--surface-2)", borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase" }}>
            {lang === "ar" ? "الصورة النشطة" : "Active Image"}
          </div>
          {imageUrl ? (
            <img src={imageUrl} alt="Active" style={{ maxWidth: 300, width: "100%", height: 200, objectFit: "cover", borderRadius: 8, border: "2px solid var(--accent)" }} />
          ) : (
            <div style={{ width: 300, height: 200, background: "var(--surface)", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>No active image</div>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 16, justifyContent: "center", fontSize: "0.85rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="radio"
                name="activeImage"
                checked={imageUrl === image1Url && !!image1Url || (!image2Url && !useImage2)}
                onChange={() => { setUseImage2(false); setImageUrl(image1Url); markDirty(); }}
              />
              {lang === "ar" ? "استخدام صورة 1" : "Use Image 1"}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: image2Url ? "pointer" : "not-allowed", opacity: image2Url ? 1 : 0.4 }}>
              <input
                type="radio"
                name="activeImage"
                checked={imageUrl === image2Url && !!image2Url}
                disabled={!image2Url}
                onChange={() => { setUseImage2(true); setImageUrl(image2Url); markDirty(); }}
              />
              {lang === "ar" ? "استخدام صورة 2" : "Use Image 2"}
            </label>
          </div>
        </div>

        {/* TWO UPLOAD BOXES SIDE BY SIDE */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          
          {/* IMAGE 1 */}
          <div style={{ padding: 16, border: "1px dashed var(--line)", borderRadius: 12 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: 8 }}>
              {lang === "ar" ? "الصورة 1" : "Image 1"}
            </label>
            {image1Url && (
              <img src={image1Url} alt="Image 1" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
            )}
            <ImageUpload onUploaded={(url) => { setImage1Url(url); if (!useImage2) setImageUrl(url); markDirty(); }} initialUrl={image1Url || undefined} />
          </div>

          {/* IMAGE 2 */}
          <div style={{ padding: 16, border: "1px dashed var(--line)", borderRadius: 12 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: 8 }}>
              {lang === "ar" ? "الصورة 2" : "Image 2"}
            </label>
            {image2Url && (
              <img src={image2Url} alt="Image 2" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
            )}
            <ImageUpload onUploaded={(url) => { setImage2Url(url); if (useImage2) setImageUrl(url); markDirty(); }} initialUrl={image2Url || undefined} />
          </div>

        </div>
      </section>

      <section className="form-section">
        <h2>{t(lang, "video")}</h2>

        <div className="video-options">
          <div className="video-option">
            <div className="video-option-label">
              <span className="video-option-num">1</span>
              <span>{lang === "ar" ? "رفع فيديو (MP4)" : "Upload video (MP4)"}</span>
            </div>
            <VideoUpload
              onUploaded={(url) => { setVideoUrl(url); markDirty(); }}
              initialUrl={videoUrl && !videoUrl.includes("youtube") && !videoUrl.includes("youtu.be") ? videoUrl : undefined}
            />
            <p className="helper">
              {lang === "ar"
                ? "ارفع فيديو من جهازك — يرفع مباشرة إلى R2."
                : "Upload a video from your device — goes straight to R2."}
            </p>
          </div>

          <div className="video-divider">
            <span>{lang === "ar" ? "أو" : "OR"}</span>
          </div>

          <div className="video-option">
            <div className="video-option-label">
              <span className="video-option-num">2</span>
              <span>{lang === "ar" ? "رابط يوتيوب" : "YouTube link"}</span>
            </div>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); markDirty(); }}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
            />
            <p className="helper">{t(lang, "video_hint")}</p>
            {videoPreviewId && (
              <div className="video-wrap" style={{ marginTop: 12 }}>
                <iframe src={`https://www.youtube.com/embed/${videoPreviewId}`} title="Preview" allowFullScreen />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>{t(lang, "ingredients")}</h2>

        <div className="ing-stack-list">
          {ingredientsList.map((ing, i) => (
            <div className="ing-stack" key={i}>
              <div className="ing-stack-head">
                <span className="ing-stack-num">{i + 1}</span>
                <span className="ing-stack-label">{lang === "ar" ? "إنجليزي" : "English"}</span>
                <button type="button" className="icon-btn" onClick={() => removeIngredient(i)} disabled={ingredientsList.length === 1}>✕</button>
              </div>

              <div className="ing-stack-en">
                <input className="cell-qty" type="text" placeholder={t(lang, "qty")} value={ing.amount} onChange={(e) => updateIngredient(i, { amount: e.target.value })} dir="ltr" />
                <div className="input-with-tools">
                  <input className="cell-unit" type="text" placeholder={t(lang, "unit")} value={ing.unit} onChange={(e) => updateIngredient(i, { unit: e.target.value })} dir="ltr" />
                  <AutoTranslate kind="unit" value={ing.unit} sourceIsAr={false} onTranslated={(v) => updateIngredient(i, { unitAr: v })} />
                  <PickerDropdown items={UNITS} title={lang === "ar" ? "اختر الوحدة" : "Pick unit"} onPick={(en, ar) => updateIngredient(i, { unit: en, unitAr: ar })} />
                </div>
                <input className="cell-name" type="text" placeholder={t(lang, "ingredient")} value={ing.name} onChange={(e) => updateIngredient(i, { name: e.target.value })} dir="ltr" />
                <div className="input-with-tools">
                  <input className="cell-prep" type="text" placeholder={t(lang, "prep_short")} value={ing.preparation} onChange={(e) => updateIngredient(i, { preparation: e.target.value })} dir="ltr" />
                  <AutoTranslate kind="prep" value={ing.preparation} sourceIsAr={false} onTranslated={(v) => updateIngredient(i, { preparationAr: v })} />
                  <PickerDropdown items={PREPARATIONS} title={lang === "ar" ? "اختر التحضير" : "Pick preparation"} onPick={(en, ar) => updateIngredient(i, { preparation: en, preparationAr: ar })} />
                </div>
              </div>

              <div className="ing-stack-divider" />

              <div className="ing-stack-ar">
                <span className="ing-stack-tag">AR</span>
                <div className="input-with-tools">
                  <input className="cell-unit" type="text" placeholder={t(lang, "unit_ar_label")} value={ing.unitAr} onChange={(e) => updateIngredient(i, { unitAr: e.target.value })} dir="rtl" />
                  <AutoTranslate kind="unit" value={ing.unitAr} sourceIsAr={true} onTranslated={(v) => updateIngredient(i, { unit: v })} />
                </div>
                <input className="cell-name" type="text" placeholder={t(lang, "ingredient_ar_label")} value={ing.nameAr} onChange={(e) => updateIngredient(i, { nameAr: e.target.value })} dir="rtl" />
                <div className="input-with-tools">
                  <input className="cell-prep" type="text" placeholder={t(lang, "prep_short_ar")} value={ing.preparationAr} onChange={(e) => updateIngredient(i, { preparationAr: e.target.value })} dir="rtl" />
                  <AutoTranslate kind="prep" value={ing.preparationAr} sourceIsAr={true} onTranslated={(v) => updateIngredient(i, { preparation: v })} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" className="add-row" onClick={addIngredient}>{t(lang, "add_ingredient")}</button>
          <button type="button" className="add-row" onClick={() => setShowBulkIng((v) => !v)} style={{ maxWidth: 220 }}>{t(lang, "bulk_paste")}</button>
        </div>
        {showBulkIng && (
          <div style={{ marginTop: 12 }}>
            <textarea placeholder={t(lang, "bulk_ing_ph")} value={bulkIngredients} onChange={(e) => setBulkIngredients(e.target.value)} style={{ width: "100%", minHeight: 140, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "var(--input-bg)", fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={applyBulkIngredients}>{t(lang, "parse_add")}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setBulkIngredients(""); setShowBulkIng(false); }}>{t(lang, "cancel")}</button>
            </div>
          </div>
        )}
      </section>

      <section className="form-section">
        <h2>{t(lang, "instructions")}</h2>
        <div className="step-stack-list">
          {steps.map((st, i) => (
            <div className="step-stack" key={i}>
              <div className="step-stack-head">
                <span className="step-stack-num">{i + 1}</span>
                <span className="step-stack-label">{lang === "ar" ? "إنجليزي" : "English"}</span>
                <button type="button" className="icon-btn" onClick={() => removeStep(i)} disabled={steps.length === 1}>✕</button>
              </div>
              <textarea placeholder={t(lang, "step_en")} value={st.text} onChange={(e) => updateStep(i, { text: e.target.value })} dir="ltr" />
              <div className="step-stack-divider" />
              <div className="step-stack-ar">
                <span className="ing-stack-tag">AR</span>
                <textarea placeholder={t(lang, "step_ar")} value={st.textAr} onChange={(e) => updateStep(i, { textAr: e.target.value })} dir="rtl" />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" className="add-row" onClick={addStep}>{t(lang, "add_step")}</button>
          <button type="button" className="add-row" onClick={() => setShowBulkStep((v) => !v)} style={{ maxWidth: 220 }}>{t(lang, "bulk_paste")}</button>
        </div>
        {showBulkStep && (
          <div style={{ marginTop: 12 }}>
            <textarea placeholder={t(lang, "bulk_step_ph")} value={bulkSteps} onChange={(e) => setBulkSteps(e.target.value)} style={{ width: "100%", minHeight: 140, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "var(--input-bg)", fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={applyBulkSteps}>{t(lang, "parse_add")}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setBulkSteps(""); setShowBulkStep(false); }}>{t(lang, "cancel")}</button>
            </div>
          </div>
        )}
      </section>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => router.push(isEdit ? `/recipes/${initial!.id}` : "/")} disabled={submitting}>{t(lang, "cancel")}</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t(lang, "saving") : isEdit ? t(lang, "save_changes") : t(lang, "save")}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </form>
  );
}
