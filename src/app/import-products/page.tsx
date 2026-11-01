"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { useModal } from "@/components/ModalProvider";

export default function ImportProductsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { show } = useModal();
  const fileRef = useRef<HTMLInputElement>(null);

  const [json, setJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJson(String(reader.result || ""));
      setResult(null);
      setError("");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!json.trim()) {
      setError(isAr ? "الرجاء لصق JSON أولاً" : "Please paste JSON first");
      return;
    }

    setImporting(true);
    setError("");
    setResult(null);

    try {
      const parsed = JSON.parse(json);
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import");
      
      setResult(data);
      show({ message: isAr ? "تم الاستيراد بنجاح!" : "Imported successfully!", tone: "info" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-head">
        <h1>{isAr ? "استيراد المنتجات" : "Import Products"}</h1>
      </div>
      <p className="page-sub">
        {isAr
          ? "الصق كود JSON من المتجر لإضافته أو تحديثه في قاعدة البيانات."
          : "Paste the JSON payload from Minim to add or update products."}
      </p>

      <div className="form-card">
        <div className="field">
          <label>JSON Data</label>
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setError(""); setResult(null); }}
            placeholder='{"products": [...]}'
            dir="ltr"
            style={{ width: "100%", minHeight: 240, padding: 12, fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.5 }}
          />
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} style={{ fontSize: 12 }}>
              📄 Open JSON File
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFilePick} style={{ display: "none" }} />
            {json && (
              <button type="button" className="btn btn-ghost" onClick={() => { setJson(""); setResult(null); setError(""); }} style={{ fontSize: 12 }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 8, fontSize: 13, marginTop: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: "var(--olive-soft)", border: "1px solid var(--olive)", borderRadius: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--olive)", margin: "0 0 8px 0" }}>
              ✅ Import Complete
            </h3>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Total products found: <strong>{result.total}</strong><br />
              Successfully processed: <strong>{result.processed}</strong><br />
              Skipped (invalid data): <strong>{result.skipped}</strong>
            </div>
            <Link href="/store" className="btn btn-primary" style={{ marginTop: 16, fontSize: 12 }}>
              Go to Store →
            </Link>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || !json.trim()}
            style={{ width: "100%", padding: 12 }}
          >
            {importing ? "Importing..." : "Import Products to Database"}
          </button>
        </div>
      </div>
    </main>
  );
}
