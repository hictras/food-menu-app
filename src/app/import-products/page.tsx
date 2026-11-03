"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { useModal } from "@/components/ModalProvider";

// Same parser logic as the API, just for the preview
function parsePackageSize(title: string): { size: number | null; unit: string | null } {
  const regex = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilos|g|gr|gram|grams|ml|l|liter|liters|litre|litres|pcs|pc|pieces|piece|oz|lb|lbs|cl)\b/i;
  const match = title.match(regex);
  if (!match) return { size: null, unit: null };

  let size = parseFloat(match[1].replace(",", "."));
  const rawUnit = match[2].toLowerCase();
  let unit = null;

  if (["kg", "kilo", "kilos"].includes(rawUnit)) unit = "kg";
  else if (["g", "gr", "gram", "grams"].includes(rawUnit)) unit = "g";
  else if (["ml"].includes(rawUnit)) unit = "ml";
  else if (["l", "liter", "liters", "litre", "litres"].includes(rawUnit)) unit = "L";
  else if (["pcs", "pc", "pieces", "piece"].includes(rawUnit)) unit = "pcs";
  else if (["oz"].includes(rawUnit)) unit = "oz";
  else if (["lb", "lbs"].includes(rawUnit)) unit = "lb";
  else if (["cl"].includes(rawUnit)) unit = "cl";

  return { size: Number.isFinite(size) ? size : null, unit };
}

export default function ImportProductsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { show } = useModal();
  const fileRef = useRef<HTMLInputElement>(null);

  const [json, setJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Parse the JSON live to show preview
  const parsedData = useMemo(() => {
    if (!json.trim()) return null;
    try {
      const parsed = JSON.parse(json);
      const list = parsed.products || (Array.isArray(parsed) ? parsed : []);
      if (!Array.isArray(list)) return null;
      return list;
    } catch {
      return null;
    }
  }, [json]);

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
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 1000 }}>
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
            style={{ width: "100%", minHeight: 200, padding: 12, fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.5 }}
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

        {/* LIVE PREVIEW TABLE */}
        {parsedData && parsedData.length > 0 && !result && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>{isAr ? "معاينة أول 50 منتج" : "Preview (first 50 items)"}</h3>
            <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "var(--bg)", position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: 10, textAlign: "start", borderBottom: "1px solid var(--line)" }}>{isAr ? "الاسم" : "Title"}</th>
                    <th style={{ padding: 10, textAlign: "start", borderBottom: "1px solid var(--line)" }}>Category</th>
                    <th style={{ padding: 10, textAlign: "center", borderBottom: "1px solid var(--line)" }}>Parsed Size</th>
                    <th style={{ padding: 10, textAlign: "end", borderBottom: "1px solid var(--line)" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 50).map((p: any, idx: number) => {
                    const { size, unit } = parsePackageSize(p.title || "");
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: 10 }}>{p.title}</td>
                        <td style={{ padding: 10, color: "var(--muted)" }}>{p.categories?.split(",")[0] || "-"}</td>
                        <td style={{ padding: 10, textAlign: "center", fontWeight: 600, color: size ? "var(--olive)" : "var(--accent)" }}>
                          {size ? `${size} ${unit}` : (isAr ? "لا يوجد" : "None")}
                        </td>
                        <td style={{ padding: 10, textAlign: "end" }}>${p.finalPrice}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
