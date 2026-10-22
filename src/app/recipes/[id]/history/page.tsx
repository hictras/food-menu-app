"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type HistoryEntry = {
  id: number;
  date: string;
  slot: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
};

export default function RecipeHistoryPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const params = useParams();
  const recipeId = params?.id as string;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!recipeId) return;
    
    // Fetch recipe name
    fetch(`/api/recipes/${recipeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.name) setRecipeName(isAr ? (data.nameAr || data.name) : data.name);
      })
      .catch(() => {});

    // Fetch history
    fetch(`/api/recipes/${recipeId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setHistory(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load");
        setLoading(false);
      });
  }, [recipeId, isAr]);

  return (
    <main style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "system-ui, sans-serif", padding: "80px 1rem 120px 1rem", direction: isAr ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href={`/recipes/${recipeId}`} style={{ color: "#8b949e", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-block", marginBottom: "1rem" }}>
            {isAr ? ar.history.backToRecipe : "← Back to Recipe"}
          </Link>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            {isAr ? ar.history.title : "Recipe History"}
          </h1>
          <p style={{ color: "#8b949e", fontSize: "15px", margin: "8px 0 0 0" }}>
            {recipeName && <strong style={{ color: "#e6edf3" }}>{recipeName}</strong>}
            {" — "}
            {isAr ? ar.history.sub : "All the days this recipe was made"}
          </p>
        </div>

        {/* HISTORY LIST */}
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
          
          {loading ? (
            <div style={{ color: "#8b949e" }}>{isAr ? ar.history.loading : "Loading..."}</div>
          ) : error ? (
            <div style={{ color: "#ff6b4a" }}>{error}</div>
          ) : history.length === 0 ? (
            <div style={{ color: "#8b949e", textAlign: "center", padding: "2rem 0" }}>
              {isAr ? ar.history.empty : "This recipe has never been made yet."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {history.map((entry, index) => (
                <Link 
                  key={entry.id} 
                  href={`/calendar/${entry.date}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b949e"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#30363d"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ 
                      width: "32px", height: "32px", borderRadius: "50%", 
                      background: "rgba(255, 107, 74, 0.1)", color: "#ff6b4a", 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      fontWeight: 700, fontSize: "14px" 
                    }}>
                      {history.length - index}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontWeight: 600, fontSize: "15px" }}>{entry.date}</span>
                      <span style={{ fontSize: "13px", color: "#8b949e", textTransform: "capitalize" }}>
                        {isAr ? ar.history.slots[entry.slot] : entry.slot}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: "#8b949e", fontSize: "13px", fontWeight: 500 }}>
                    {isAr ? ar.history.viewDay : "View Day"} →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
