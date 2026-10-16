"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import { DIETARY_TAGS } from "@/lib/dietary-tags";
import { parseIngredientsBulk } from "@/lib/parse-ingredients";
import { extractYouTubeId } from "@/lib/youtube";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";

type Ingredient = { name: string; amount: string; unit: string; preparation: string };
type Step = { text: string };

type InitialData = {
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
  ingredients: { name: string; amount: string | null; unit: string | null; preparation: string | null }[];
  instructions: { text: string }[];
};

const TAG_AR: Record<string, string> = {
  Vegetarian: "نباتي",
  Vegan: "نباتي صرف",
  "Gluten-Free": "خالٍ من الغلوتين",
  "Dairy-Free": "خالٍ من الألبان",
  "Nut-Free": "خالٍ من المكسرات",
  Halal: "حلال",
  Kosher: "كوشير",
  "Low-Carb": "قليل الكربوهيدرات",
  Keto: "كيتو",
  Paleo: "باليو",
  Spicy: "حار",
  Quick: "سريع",
};

export default function RecipeForm({ initial }: { initial?: InitialData }) {
  const router = useRouter();
  const { lang } = useLang();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [prepTime, setPrepTime] = useState(initial?.prepTime ? String(initial.prepTime) : "");
  const [cookTime, setCookTime] = useState(initial?.cookTime ? String(initial.cookTime) : "");
  const [servings, setServings] = useState(initial?.servings ? String(initial.servings) : "4");
  const [tags, setTags] = useState<string[]>(() => {
    if (!initial?.dietaryTags) return [];
    try { return JSON.parse(initial.dietaryTags); } catch { return []; }
  });
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");

  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>(
    initial?.ingredients?.length
      ? initial.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount ?? "",
          unit: i.unit ?? "",
          preparation: i.preparation ?? "",
        }))
      : [{ name: "", amount: "", unit: "", preparation: "" }]
  );

  const [steps, setSteps] = useState<Step[]>(
    initial?.instructions?.length
      ? initial.instructions.map((s) => ({ text: s.text }))
      : [{ text: "" }]
  );

  const [bulkIngredients, setBulkIngredients] = useState("");
  const [bulkSteps, setBulkSteps] = useState("");
  const [showBulkIng, setShowBulkIng] = useState(false);
  const [showBulkStep, setShowBulkStep] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const totalTime = useMemo(() => (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0), [prepTime, cookTime]);
  const videoPreviewId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (name || description) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [name, description]);

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }
  function updateIngredient(i: number, patch: Partial<Ingredient>) {
    setIngredientsList((list) => list.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)));
  }
  function addIngredient() {
    setIngredientsList((l) => [...l, { name: "", amount: "", unit: "", preparation: "" }]);
  }
  function removeIngredient(i: number) {
    setIngredientsList((l) => (l.length === 1 ? l : l.filter((_, idx) => idx !== i)));
  }
  function applyBulkIngredients() {
    const parsed = parseIngredientsBulk(bulkIngredients);
    if (parsed.length === 0) return;
    setIngredientsList((prev) => {
      const cleaned = prev.filter((i) => i.name.trim() || i.amount.trim());
      return [...cleaned, ...parsed];
    });
    setBulkIngredients("");
    setShowBulkIng(false);
  }
  function updateStep(i: number, text: string) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { text } : st)));
  }
  function addStep() { setSteps((s) => [...s, { text: "" }]); }
  function removeStep(i: number) {
    setSteps((s) => (s.length === 1 ? s : s.filter((_, idx) => idx !== i)));
  }
  function applyBulkSteps() {
    const lines = bulkSteps.split(/\r?\n/)
      .map((l) => l.replace(/^[\s•·●○▪▫■□◆◇♦→*\-–—]+/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setSteps((prev) => {
      const cleaned = prev.filter((s) => s.text.trim());
      return [...cleaned, ...lines.map((text) => ({ text }))];
    });
    setBulkSteps("");
    setShowBulkStep(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError(t(lang, "name_required")); return; }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/recipes/${initial!.id}` : "/api/recipes";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, cuisine,
          prepTime: parseInt(prepTime) || 0,
          cookTime: parseInt(cookTime) || 0,
          servings: parseInt(servings) || 1,
          dietaryTags: tags,
          imageUrl,
          videoUrl: videoUrl.trim() || null,
          ingredients: ingredientsList.filter((i) => i.name.trim()).map((i) => ({
            name: i.name, amount: i.amount, unit: i.unit, preparation: i.preparation,
          })),
          instructions: steps.filter((s) => s.text.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save recipe");
      }

      setToast(isEdit ? t(lang, "recipe_updated") : t(lang, "recipe_saved"));
      const dest = isEdit ? `/recipes/${initial!.id}` : "/";
      setTimeout(() => router.push(dest), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "#fdecea", color: "#c84b31", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      <section className="form-section">
        <h2>{t(lang, "basics")}</h2>

        <div className="field">
          <label htmlFor="name">{t(lang, "name")} *</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="description">{t(lang, "description")}</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t(lang, "description_ph")} />
        </div>

        <div className="field">
          <label htmlFor="cuisine">{t(lang, "cuisine")}</label>
          <input id="cuisine" type="text" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder={t(lang, "cuisine_ph")} />
        </div>
      </section>

      <section className="form-section">
        <h2>
          {t(lang, "time_servings")}
          {totalTime > 0 && (
            <span className="total-time">⏱ {totalTime} {t(lang, "min_total")}</span>
          )}
        </h2>

        <div className="field-row">
          <div className="field">
            <label htmlFor="prep">{t(lang, "prep")}</label>
            <input id="prep" type="number" min="0" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cook">{t(lang, "cook")}</label>
            <input id="cook" type="number" min="0" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="servings">{t(lang, "servings")}</label>
            <input id="servings" type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} />
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
        <ImageUpload onUploaded={setImageUrl} initialUrl={imageUrl ?? undefined} />
        <p className="helper">{t(lang, "photo_hint")}</p>
      </section>

      <section className="form-section">
        <h2>{t(lang, "video")}</h2>
        <div className="field">
          <label htmlFor="videoUrl">{t(lang, "video_label")}</label>
          <input id="videoUrl" type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={t(lang, "video_ph")} />
          <p className="helper">{t(lang, "video_hint")}</p>
        </div>
        {videoPreviewId && (
          <div className="video-wrap" style={{ marginTop: 12 }}>
            <iframe src={`https://www.youtube.com/embed/${videoPreviewId}`} title="Preview" allowFullScreen />
          </div>
        )}
      </section>

      <section className="form-section">
        <h2>{t(lang, "ingredients")}</h2>
        <div className="row-list">
          {ingredientsList.map((ing, i) => (
            <div className="row" key={i} style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 130px auto", gap: 10 }}>
              <input type="text" placeholder={t(lang, "qty")} value={ing.amount} onChange={(e) => updateIngredient(i, { amount: e.target.value })} />
              <input type="text" placeholder={t(lang, "unit")} value={ing.unit} onChange={(e) => updateIngredient(i, { unit: e.target.value })} />
              <input type="text" placeholder={t(lang, "ingredient")} value={ing.name} onChange={(e) => updateIngredient(i, { name: e.target.value })} />
              <input type="text" placeholder={t(lang, "prep_short")} value={ing.preparation} onChange={(e) => updateIngredient(i, { preparation: e.target.value })} />
              <button type="button" className="icon-btn" onClick={() => removeIngredient(i)} disabled={ingredientsList.length === 1}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" className="add-row" onClick={addIngredient}>{t(lang, "add_ingredient")}</button>
          <button type="button" className="add-row" onClick={() => setShowBulkIng((v) => !v)} style={{ maxWidth: 220 }}>{t(lang, "bulk_paste")}</button>
        </div>
        {showBulkIng && (
          <div style={{ marginTop: 12 }}>
            <textarea placeholder={t(lang, "bulk_ing_ph")} value={bulkIngredients} onChange={(e) => setBulkIngredients(e.target.value)} style={{ width: "100%", minHeight: 140, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg)", fontSize: 14 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={applyBulkIngredients}>{t(lang, "parse_add")}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setBulkIngredients(""); setShowBulkIng(false); }}>{t(lang, "cancel")}</button>
            </div>
          </div>
        )}
      </section>

      <section className="form-section">
        <h2>{t(lang, "instructions")}</h2>
        <div className="row-list">
          {steps.map((st, i) => (
            <div className="row row-step" key={i}>
              <div className="step-num">{i + 1}</div>
              <textarea value={st.text} onChange={(e) => updateStep(i, e.target.value)} />
              <button type="button" className="icon-btn" onClick={() => removeStep(i)} disabled={steps.length === 1}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" className="add-row" onClick={addStep}>{t(lang, "add_step")}</button>
          <button type="button" className="add-row" onClick={() => setShowBulkStep((v) => !v)} style={{ maxWidth: 220 }}>{t(lang, "bulk_paste")}</button>
        </div>
        {showBulkStep && (
          <div style={{ marginTop: 12 }}>
            <textarea placeholder={t(lang, "bulk_step_ph")} value={bulkSteps} onChange={(e) => setBulkSteps(e.target.value)} style={{ width: "100%", minHeight: 140, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg)", fontSize: 14 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={applyBulkSteps}>{t(lang, "parse_add")}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setBulkSteps(""); setShowBulkStep(false); }}>{t(lang, "cancel")}</button>
            </div>
          </div>
        )}
      </section>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => router.push(isEdit ? `/recipes/${initial!.id}` : "/")} disabled={submitting}>
          {t(lang, "cancel")}
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t(lang, "saving") : isEdit ? t(lang, "save_changes") : t(lang, "save")}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </form>
  );
}
