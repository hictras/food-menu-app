"use client";

import { useState, useEffect, useMemo } from "react";
import { useLang } from "./LanguageProvider";

type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
};

export default function AdminSender() {
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  
  const [title, setTitle] = useState("Menu");
  const [body, setBody] = useState("New recipe added!");
  const [url, setUrl] = useState(""); // Empty by default

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const baseUrl = "https://food-menu-app-xxww.onrender.com";

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
      const fullUrl = url.trim().startsWith("/") ? `${baseUrl}${url}` : url.trim();

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url: fullUrl }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setBusy(false);
    }
  }

  const previewRecipe = useMemo(() => {
    const match = url.match(/\/recipes\/(\d+)/);
    if (match) return recipes.find(r => r.id === parseInt(match[1]));
    return null;
  }, [url, recipes]);

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1>{lang === "ar" ? "إرسال إشعار" : "Send Push Notification"}</h1>
      
      <div className="form-card">
        <div className="field">
          <label>{lang === "ar" ? "العنوان" : "Title"}</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>
        <div className="field">
          <label>{lang === "ar" ? "النص" : "Body"}</label>
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>

        <div className="field" style={{ position: "relative" }}>
          <label>{lang === "ar" ? "ابحث عن وصفة لربطها (اختياري)" : "Search Recipe (Optional)"}</label>
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
                    <div key={r.id} onClick={() => selectRecipe(r.id)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      {lang === "ar" && r.nameAr ? r.nameAr : r.name}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="field">
          <label>{lang === "ar" ? "الرابط (اختياري)" : "URL (Optional)"}</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Leave empty to send text only" style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>

        {url.trim() !== "" && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Inbox Preview</label>
            <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Just now</span>
              </div>
              <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--ink-soft)" }}>{body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8 }}>
                {previewRecipe?.imageUrl ? <img src={previewRecipe.imageUrl} alt="Preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 60, height: 60, borderRadius: 6, background: "var(--line)" }} />}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <strong style={{ fontSize: 13, color: "var(--accent)" }}>{previewRecipe ? previewRecipe.name : "View Link"}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{url}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button className="btn btn-primary" onClick={send} disabled={busy} style={{ width: "100%", padding: 12 }}>
          {busy ? "Sending..." : "Send"}
        </button>

        {result && <pre style={{ marginTop: 16, fontSize: 13, background: "#f5f5f5", padding: 12, borderRadius: 8 }}>{result}</pre>}
      </div>
    </main>
  );
}
