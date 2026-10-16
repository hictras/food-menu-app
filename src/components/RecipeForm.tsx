"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import { DIETARY_TAGS } from "@/lib/dietary-tags";

type Ingredient = { name: string; amount: string; unit: string };
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
  ingredients: { name: string; amount: string | null; unit: string | null }[];
  instructions: { text: string }[];
};

export default function RecipeForm({ initial }: { initial?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [prepTime, setPrepTime] = useState(
    initial?.prepTime ? String(initial.prepTime) : ""
  );
  const [cookTime, setCookTime] = useState(
    initial?.cookTime ? String(initial.cookTime) : ""
  );
  const [servings, setServings] = useState(
    initial?.servings ? String(initial.servings) : "4"
  );
  const [tags, setTags] = useState<string[]>(() => {
    if (!initial?.dietaryTags) return [];
    try {
      return JSON.parse(initial.dietaryTags);
    } catch {
      return [];
    }
  });
  const [imageUrl, setImageUrl] = useState<string | null>(
    initial?.imageUrl ?? null
  );

  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>(
    initial?.ingredients?.length
      ? initial.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount ?? "",
          unit: i.unit ?? "",
        }))
      : [{ name: "", amount: "", unit: "" }]
  );

  const [steps, setSteps] = useState<Step[]>(
    initial?.instructions?.length
      ? initial.instructions.map((s) => ({ text: s.text }))
      : [{ text: "" }]
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const totalTime = useMemo(() => {
    const p = parseInt(prepTime) || 0;
    const c = parseInt(cookTime) || 0;
    return p + c;
  }, [prepTime, cookTime]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (name || description) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [name, description]);

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function updateIngredient(i: number, patch: Partial<Ingredient>) {
    setIngredientsList((list) =>
      list.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing))
    );
  }

  function addIngredient() {
    setIngredientsList((l) => [...l, { name: "", amount: "", unit: "" }]);
  }

  function removeIngredient(i: number) {
    setIngredientsList((l) =>
      l.length === 1 ? l : l.filter((_, idx) => idx !== i)
    );
  }

  function updateStep(i: number, text: string) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { text } : st)));
  }

  function addStep() {
    setSteps((s) => [...s, { text: "" }]);
  }

  function removeStep(i: number) {
    setSteps((s) => (s.length === 1 ? s : s.filter((_, idx) => idx !== i)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Recipe name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/recipes/${initial!.id}` : "/api/recipes";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          cuisine,
          prepTime: parseInt(prepTime) || 0,
          cookTime: parseInt(cookTime) || 0,
          servings: parseInt(servings) || 1,
          dietaryTags: tags,
          imageUrl,
          ingredients: ingredientsList.filter((i) => i.name.trim()),
          instructions: steps.filter((s) => s.text.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save recipe");
      }

      setToast(isEdit ? "Recipe updated!" : "Recipe saved!");
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
        <div
          style={{
            background: "#fdecea",
            color: "#c84b31",
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <section className="form-section">
        <h2>Basics</h2>

        <div className="field">
          <label htmlFor="name">Recipe name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunday Shakshuka"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="description">Short description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A one-line summary — what makes this dish special?"
          />
        </div>

        <div className="field">
          <label htmlFor="cuisine">Cuisine</label>
          <input
            id="cuisine"
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Italian, Lebanese, Japanese..."
          />
        </div>
      </section>

      <section className="form-section">
        <h2>
          Time &amp; Servings
          {totalTime > 0 && (
            <span className="total-time">⏱ {totalTime} min total</span>
          )}
        </h2>

        <div className="field-row">
          <div className="field">
            <label htmlFor="prep">Prep (min)</label>
            <input
              id="prep"
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="15"
            />
          </div>
          <div className="field">
            <label htmlFor="cook">Cook (min)</label>
            <input
              id="cook"
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="field">
            <label htmlFor="servings">Servings</label>
            <input
              id="servings"
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Dietary tags</h2>
        <p className="helper" style={{ marginBottom: 14, marginTop: -8 }}>
          Click to toggle. Leave empty if none apply.
        </p>
        <div className="chips">
          {DIETARY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip${tags.includes(tag) ? " active" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>Photo</h2>
        <ImageUpload onUploaded={setImageUrl} initialUrl={imageUrl ?? undefined} />
        <p className="helper">
          Optional. Uploads go straight to Cloudflare R2.
        </p>
      </section>

      <section className="form-section">
        <h2>Ingredients</h2>
        <div className="row-list">
          {ingredientsList.map((ing, i) => (
            <div className="row row-ing" key={i}>
              <input
                type="text"
                placeholder="Ingredient"
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Qty"
                value={ing.amount}
                onChange={(e) =>
                  updateIngredient(i, { amount: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => removeIngredient(i)}
                disabled={ingredientsList.length === 1}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="add-row" onClick={addIngredient}>
          + Add ingredient
        </button>
      </section>

      <section className="form-section">
        <h2>Instructions</h2>
        <div className="row-list">
          {steps.map((st, i) => (
            <div className="row row-step" key={i}>
              <div className="step-num">{i + 1}</div>
              <textarea
                placeholder={`Step ${i + 1}...`}
                value={st.text}
                onChange={(e) => updateStep(i, e.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => removeStep(i)}
                disabled={steps.length === 1}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="add-row" onClick={addStep}>
          + Add step
        </button>
      </section>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push(isEdit ? `/recipes/${initial!.id}` : "/")}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : isEdit
            ? "Save changes"
            : "Save recipe"}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </form>
  );
}
