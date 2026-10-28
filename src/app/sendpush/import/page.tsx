"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type ParsedRecipe = {
  name?: string;
  nameAr?: string;
  ingredients?: unknown[];
  instructions?: unknown[];
  [key: string]: unknown;
};

type PreviewRow = {
  index: number;
  name: string;
  ingredients: number;
  steps: number;
  warning: string | null;
};

const SAMPLE = JSON.stringify(
  [
    {
      name: "Chicken Maqluba",
      nameAr: "مقلوبة دجاج",
      description: "Layered rice, chicken, and vegetables",
      cuisine: "Palestinian",
      category: "Main Dish",
      prepTime: 30,
      cookTime: 60,
      servings: 4,
      dietaryTags: ["Halal"],
      imageUrl: null,
      videoUrl: null,
      ingredients: [
        { name: "Chicken thighs", nameAr: "أفخاذ دجاج", amount: "1", unit: "kg" }
      ],
      instructions: [
        { text: "Brown the chicken.", textAr: "حمّر الدجاج." }
      ]
    }
  ],
  null,
  2
);

export default function ImportRecipesPage() {
  const { lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const [json, setJson] = useState("");
  const [targetId, setTargetId] = useState("");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated?: number; ids: number[]; updatedIds?: number[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setPreview(null);
    setParseError("");
    setResult(null);
  };

  function normalize(input: string): ParsedRecipe[] {
    const trimmed = input.trim();
    if (!trimmed) throw new Error("Paste JSON first");
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch (e) {
      throw new Error("Invalid JSON: " + (e as Error).message);
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.recipes)) return obj.recipes as ParsedRecipe[];
      return [obj as ParsedRecipe];
    }
    if (!Array.isArray(data)) throw new Error("Expected JSON array or object");
    return data as ParsedRecipe[];
  }

  function applyTargetId(list: ParsedRecipe[]): ParsedRecipe[] {
    if (!targetId.trim()) return list;
    const idNum = parseInt(targetId.trim(), 10);
    if (isNaN(idNum)) throw new Error("ID must be a number");
    return list.map((r) => ({ ...r, id: idNum }));
  }

  function handleParse() {
    reset();
    try {
      let list = normalize(json);
      list = applyTargetId(list);
      const rows: PreviewRow[] = list.map((r, i) => {
        const name = (r.name as string) || (r.nameAr as string) || "";
        const ing = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
        const steps = Array.isArray(r.instructions) ? r.instructions.length : 0;
        let warning: string | null = null;
        if (!name.trim()) warning = "Missing name — will skip";
        return { index: i + 1, name: name || "(unnamed)", ingredients: ing, steps, warning };
      });
      setPreview(rows);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJson(String(reader.result || ""));
      reset();
    };
    reader.readAsText(file);
  }, []);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJson(String(reader.result || ""));
      reset();
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    reset();
    let list: ParsedRecipe[];
    try {
      list = normalize(json);
      list = applyTargetId(list);
    } catch (e) {
      setParseError((e as Error).message);
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/recipes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || "Import failed");
      } else {
        setResult({
          inserted: data.inserted || 0,
          updated: data.updated || 0,
          ids: data.insertedIds || data.ids || [],
          updatedIds: data.updatedIds || [],
        });
        setPreview(null);
      }
    } catch (e) {
      setParseError((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function loadSample() {
    setJson(SAMPLE);
    reset();
  }

  function clearAll() {
    setJson("");
    setTargetId("");
    reset();
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "استيراد وصفات" : "Import Recipes"}</h1>
      </div>
      <p className="page-sub">
        {lang === "ar"
          ? "الصق مصفوفة JSON من الوصفات — سيتم عرضها للمعاينة قبل الحفظ"
          : "Paste a JSON array of recipes — preview before saving"}
      </p>

      <div className="form-card">
        {/* TARGET ID FIELD */}
        <div className="field" style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            {lang === "ar" ? "معرف الوصفة (اتركه فارغاً لإنشاء جديدة)" : "Recipe ID (leave blank to create new)"}
          </label>
          <input
            type="number"
            value={targetId}
            onChange={(e) => { setTargetId(e.target.value); reset(); }}
            placeholder={lang === "ar" ? "مثال: 105" : "e.g. 105"}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              border: "1px solid var(--line)",
              borderRadius: 8,
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {lang === "ar"
              ? "إذا أدخلت معرفاً موجوداً، سيتم تحديث الوصفة. إذا تركته فارغاً، سيتم إنشاء وصفة جديدة."
              : "If you enter an existing ID, the recipe will be updated. Leave blank to create a new recipe."}
          </div>
        </div>

        <div className="field">
          <label>JSON</label>
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); reset(); }}
            placeholder='[{"name":"Recipe","ingredients":[],"instructions":[]}]'
            dir="ltr"
            style={{ width: "100%", minHeight: 240, padding: 12, fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.5 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          />
          {dragOver && (
            <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 6 }}>
              Drop file to load
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={loadSample} style={{ fontSize: 12 }}>
              Sample
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 12 }}>
              Open file
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFilePick} style={{ display: "none" }} />
            {json && (
              <button type="button" className="btn btn-ghost" onClick={clearAll} style={{ fontSize: 12 }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {parseError && (
          <div style={{ padding: "10px 14px", background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 8, fontSize: 13, marginTop: 12 }}>
            {parseError}
          </div>
        )}

        {preview && preview.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 10 }}>
              Preview ({preview.length})
              {targetId.trim() && (
                <span style={{ marginLeft: 8, color: "var(--accent)" }}>
                  · Will update ID {targetId}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {preview.map((row) => (
                <div
                  key={row.index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: row.warning ? "var(--accent-soft)" : "var(--bg)",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontWeight: 700, color: row.warning ? "var(--accent)" : "var(--olive)", minWidth: 24 }}>
                    {row.warning ? "!" : "OK"}
                  </span>
                  <span style={{ flex: 1, color: "var(--ink)", fontWeight: 500 }}>
                    {row.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {row.ingredients} ing · {row.steps} steps
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 20, padding: 14, background: "var(--olive-soft)", border: "1px solid var(--olive)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--olive)", marginBottom: 6 }}>
              {result.inserted > 0 && `Inserted ${result.inserted} new recipe(s). `}
              {result.updated && result.updated > 0 && `Updated ${result.updated} existing recipe(s).`}
            </div>
            {result.ids.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>
                New IDs: {result.ids.join(", ")}
              </div>
            )}
            {result.updatedIds && result.updatedIds.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 10 }}>
                Updated IDs: {result.updatedIds.join(", ")}
              </div>
            )}
            <Link 
              href={
                result.updatedIds && result.updatedIds.length > 0 
                  ? `/recipes/${result.updatedIds[0]}`
                  : result.ids.length > 0 
                  ? `/recipes/${result.ids[0]}`
                  : "/"
              } 
              className="btn btn-primary" 
              style={{ fontSize: 12 }}
            >
              {result.updatedIds && result.updatedIds.length > 0 ? "View Updated Recipe" : "View New Recipe"}
            </Link>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={handleParse} style={{ flex: 1 }}>
            Parse & Preview
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || !json.trim()}
            style={{ flex: 2 }}
          >
            {importing ? "Importing..." : targetId.trim() ? `Update ID ${targetId}` : "Import as New"}
          </button>
        </div>
      </div>
    </main>
  );
}
