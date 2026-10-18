"use client";

import { useState, useEffect, useMemo } from "react";
import { useLang } from "./LanguageProvider";

type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
};

export default function AdminSender() {
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  
  const [title, setTitle] = useState("Menu");
  const [body, setBody] = useState("New recipe added!");
  const [url, setUrl] = useState("/inbox");
  const [targetDevice, setTargetDevice] = useState("");

  // Recipe Search State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]));
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const lower = searchQuery.toLowerCase();
    return recipes.filter(r => 
      r.name.toLowerCase().includes(lower) || 
      (r.nameAr && r.nameAr.includes(searchQuery))
    );
  }, [recipes, searchQuery]);

  function selectRecipe(id: number) {
    setUrl(`/recipes/${id}?today`);
    setSearchQuery("");
    setShowDropdown(false);
  }

  async function send() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url, targetDevice }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1>{lang === "ar" ? "إرسال إشعار" : "Send Push Notification"}</h1>
      
      <div className="form-card">
        {/* Device Targeting */}
        <div className="field">
          <label>{lang === "ar" ? "جهاز محدد (اختياري)" : "Target Device (Optional)"}</label>
          <input
            type="text"
            value={targetDevice}
            onChange={(e) => setTargetDevice(e.target.value)}
            placeholder="e.g. Hicham's iPhone (leave blank to send to all)"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
        </div>

        {/* Message Fields */}
        <div className="field">
          <label>{lang === "ar" ? "العنوان" : "Title"}</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>
        <div className="field">
          <label>{lang === "ar" ? "النص" : "Body"}</label>
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>

        {/* Recipe Search & Link Auto-fill */}
        <div className="field" style={{ position: "relative" }}>
          <label>{lang === "ar" ? "ابحث عن وصفة لربطها" : "Search Recipe to Auto-fill Link"}</label>
          <input 
            type="text" 
            placeholder="Type recipe name..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          
          {showDropdown && searchQuery.trim() !== "" && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipes.length === 0 ? (
                  <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipes found</div>
                ) : (
                  filteredRecipes.map((r) => (
                    <div 
                      key={r.id}
                      onClick={() => selectRecipe(r.id)}
                      style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {lang === "ar" && r.nameAr ? r.nameAr : r.name}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="field">
          <label>{lang === "ar" ? "الرابط" : "URL"}</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>
        
        <button className="btn btn-primary" onClick={send} disabled={busy} style={{ width: "100%", padding: 12 }}>
          {busy ? "Sending..." : lang === "ar" ? "إرسال" : "Send"}
        </button>

        {result && (
          <pre style={{ marginTop: 16, fontSize: 13, background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}
