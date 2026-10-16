"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import { DIETARY_TAGS } from "@/lib/dietary-tags";

type Ingredient = { name: string; amount: string; unit: string };
type Step = { text: string };

export default function RecipeForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("4");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "" },
  ]);
  const [steps, setSteps] = useState<Step[]>([{ text: "" }]);

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

  function moveIngredient(i: number, dir: -1 | 1) {
    setIngredientsList((l) => {
      const next = [...l];
      const j = i + dir;
      if (j < 0 || j >= next.length) return l;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
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

  function moveStep(i: number, dir: -1 | 1) {
    setSteps((s) => {
      const next = [...s];
      const j = i + dir;
      if (j < 0 || j >= next.length) return s;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
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
      const res = await fetch("/api/recipes", {
        method: "POST",
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

      setToast("Recipe saved!");
      setTimeout(() => router.push("/"), 700);
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

      {/* BASIC INFO */}
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

      {/* TIMING */}
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

      {/* TAGS */}
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

      {/* PHOTO */}
      <section className="form-section">
        <h2>Photo</h2>
        <ImageUpload onUploaded={setImageUrl} initialUrl={imageUrl ?? undefined} />
        <p className="helper">
          Optional. Uploads go straight to Cloudflare R2.
        </p>
      </section>

      {/* INGREDIENTS */}
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
                title="Remove"
                disabled={ingredientsList.length === 1}
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

      {/* INSTRUCTIONS */}
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

      {/* ACTIONS */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push("/")}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save recipe"}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </form>
  );
}
