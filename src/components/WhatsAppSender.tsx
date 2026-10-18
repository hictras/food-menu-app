"use client";

import { useEffect, useState, useMemo } from "react";
import { useLang } from "./LanguageProvider";

type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
};

export default function WhatsAppSender() {
  const { lang } = useLang();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Recipe 1 State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Recipe 2 State
  const [searchQuery2, setSearchQuery2] = useState("");
  const [selectedId2, setSelectedId2] = useState<string>("");
  const [showDropdown2, setShowDropdown2] = useState(false);

  // Message Fields
  const [greeting, setGreeting] = useState("*Thank you for joining dinner yesterday*");
  const [line1, setLine1] = useState("We were honored by your presence!");
  const [line2, setLine2] = useState("We hope you enjoyed:");
  const [linkText, setLinkText] = useState("View the full recipe here:");
  const [includeToday, setIncludeToday] = useState(false);
  const [signature, setSignature] = useState("- Hicham");

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        setRecipes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter for Recipe 1
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const lower = searchQuery.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(lower) || (r.nameAr && r.nameAr.includes(searchQuery)));
  }, [recipes, searchQuery]);

  // Filter for Recipe 2
  const filteredRecipes2 = useMemo(() => {
    if (!searchQuery2.trim()) return recipes;
    const lower = searchQuery2.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(lower) || (r.nameAr && r.nameAr.includes(searchQuery2)));
  }, [recipes, searchQuery2]);

  const selectedRecipe = recipes.find((r) => r.id.toString() === selectedId);
  const recipeName = selectedRecipe ? (lang === "ar" && selectedRecipe.nameAr ? selectedRecipe.nameAr : selectedRecipe.name) : "";
  
  const selectedRecipe2 = recipes.find((r) => r.id.toString() === selectedId2);
  const recipeName2 = selectedRecipe2 ? (lang === "ar" && selectedRecipe2.nameAr ? selectedRecipe2.nameAr : selectedRecipe2.name) : "";
  
  const baseUrl = "https://food-menu-app-xxww.onrender.com";
  const suffix = includeToday ? "?today" : "";
  
  const recipeLink = selectedId ? `${baseUrl}/recipes/${selectedId}${suffix}` : "";
  const recipeLink2 = selectedId2 ? `${baseUrl}/recipes/${selectedId2}${suffix}` : "";

  // Build final message
  const messageParts = [
    greeting,
    line1,
    line2,
    // Recipe 1
    selectedId && recipeName ? `*${recipeName}*` : "",
    selectedId && recipeLink ? recipeLink : "",
    // Recipe 2 (if selected)
    selectedId2 && recipeName2 ? `*${recipeName2}*` : "",
    selectedId2 && recipeLink2 ? recipeLink2 : "",
    // Link Text (ONLY show if NO recipes are selected)
    (!selectedId && !selectedId2) ? linkText : "",
    signature
  ];

  // Combine and clean up empty lines
  const finalMessage = messageParts
    .filter(part => part && part.trim() !== "")
    .join("\n\n")
    .replace(/^\uFEFF/, "")
    .replace(/\uFEFF/g, "");

  function openWhatsApp() {
    if (!finalMessage.trim()) return;
    const encoded = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "إرسال واتساب" : "Send WhatsApp"}</h1>
      </div>
      <p className="page-sub">
        {lang === "ar" ? "أرسل رسالة مخصصة مع روابط الوصفات" : "Send a custom message with recipe links"}
      </p>

      <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Recipe 1 Selector */}
        <div className="field" style={{ position: "relative" }}>
          <label>Recipe 1 (Optional)</label>
          {selectedRecipe ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent-soft)" }}>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>{recipeName}</span>
              <button type="button" onClick={() => { setSelectedId(""); setSearchQuery(""); }} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: "bold" }}>✕</button>
            </div>
          ) : (
            <input 
              type="text" placeholder="Type to search..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
            />
          )}
          {showDropdown && !selectedRecipe && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipes.length === 0 ? <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipes found</div> : filteredRecipes.map((r) => (
                  <div key={r.id} onClick={() => { setSelectedId(r.id.toString()); setShowDropdown(false); }} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    {lang === "ar" && r.nameAr ? r.nameAr : r.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recipe 2 Selector */}
        <div className="field" style={{ position: "relative" }}>
          <label>Recipe 2 (Optional)</label>
          {selectedRecipe2 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent-soft)" }}>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>{recipeName2}</span>
              <button type="button" onClick={() => { setSelectedId2(""); setSearchQuery2(""); }} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: "bold" }}>✕</button>
            </div>
          ) : (
            <input 
              type="text" placeholder="Type to search..." value={searchQuery2}
              onChange={(e) => { setSearchQuery2(e.target.value); setShowDropdown2(true); }}
              onFocus={() => setShowDropdown2(true)}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
            />
          )}
          {showDropdown2 && !selectedRecipe2 && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowDropdown2(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipes2.length === 0 ? <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipes found</div> : filteredRecipes2.map((r) => (
                  <div key={r.id} onClick={() => { setSelectedId2(r.id.toString()); setShowDropdown2(false); }} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    {lang === "ar" && r.nameAr ? r.nameAr : r.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Message Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--bg)", padding: 16, borderRadius: 8, border: "1px solid var(--line)" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Greeting / Title</label>
            <input type="text" value={greeting} onChange={(e) => setGreeting(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Line 1</label>
            <input type="text" value={line1} onChange={(e) => setLine1(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Line 2</label>
            <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Link Text (Only shows if no recipe is selected)</label>
            <input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Signature / Footer</label>
            <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="e.g. - Hicham" style={{ width: "100%", padding: 8 }} />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input type="checkbox" id="today-check" checked={includeToday} onChange={(e) => setIncludeToday(e.target.checked)} />
            <label htmlFor="today-check" style={{ margin: 0, cursor: "pointer", fontSize: 13 }}>Add <code>?today</code> to links</label>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            {lang === "ar" ? "معاينة حية" : "Live Preview"}
          </label>
          <div style={{ background: "#e5ddd5", padding: 16, borderRadius: 12 }}>
            <div style={{ background: "#dcf8c6", padding: 12, borderRadius: 10, maxWidth: "90%", whiteSpace: "pre-wrap", fontSize: 14, color: "#000", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
              {finalMessage || "Type a message..."}
              
              {selectedRecipe && recipeLink && (
                <div style={{ background: "rgba(0,0,0,0.05)", borderRadius: 8, marginTop: 8, overflow: "hidden", borderLeft: "3px solid #25D366" }}>
                  {selectedRecipe.imageUrl && <img src={selectedRecipe.imageUrl} alt="Preview" style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                  <div style={{ padding: 8 }}>
                    <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 2 }}>{recipeName}</div>
                    <div style={{ fontSize: 11, color: "#666", wordBreak: "break-all" }}>{recipeLink}</div>
                  </div>
                </div>
              )}

              {selectedRecipe2 && recipeLink2 && (
                <div style={{ background: "rgba(0,0,0,0.05)", borderRadius: 8, marginTop: 8, overflow: "hidden", borderLeft: "3px solid #25D366" }}>
                  {selectedRecipe2.imageUrl && <img src={selectedRecipe2.imageUrl} alt="Preview" style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                  <div style={{ padding: 8 }}>
                    <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 2 }}>{recipeName2}</div>
                    <div style={{ fontSize: 11, color: "#666", wordBreak: "break-all" }}>{recipeLink2}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button onClick={openWhatsApp} className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 16, background: "#25D366", borderColor: "#25D366", color: "#fff" }} disabled={!finalMessage.trim()}>
          {lang === "ar" ? "فتح واتساب" : "Open WhatsApp"}
        </button>

      </div>
    </main>
  );
}
