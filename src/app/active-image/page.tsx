"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { cuisineFlagUrl } from "@/lib/cuisine-flag";

type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
  cuisine: string | null;
  cuisineAr: string | null;
  imageUrl: string | null;
  image1Url: string | null;
  image2Url: string | null;
  useImage2: boolean | null;
};

export default function ActiveImagePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (!data.admin) router.push("/login");
        else loadRecipes();
      });
  }, [router]);

  function loadRecipes() {
    fetch("/api/recipes", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        setRecipes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function toggleImage(recipe: Recipe) {
    const newState = !recipe.useImage2;
    const newActiveUrl = newState ? recipe.image2Url : recipe.image1Url;

    await fetch(`/api/recipes/${recipe.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: recipe.name,
        nameAr: recipe.nameAr,
        isHidden: 0,
        useImage2: newState,
        image1Url: recipe.image1Url,
        image2Url: recipe.image2Url,
        imageUrl: newActiveUrl || recipe.imageUrl,
      }),
    });

    setRecipes(prev => prev.map(r => r.id === recipe.id
      ? { ...r, useImage2: newState, imageUrl: newActiveUrl || r.imageUrl }
      : r));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter(r => {
      if (!q) return true;
      const name = (isAr ? (r.nameAr || r.name) : r.name).toLowerCase();
      return name.includes(q);
    });
  }, [recipes, query, isAr]);

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 900 }}>
      <div className="page-head">
        <h1>{isAr ? "الصور النشطة" : "Active Image"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? "اختر الصورة النشطة لكل وصفة (1 أو 2)" : "Choose the active image for each recipe (1 or 2)"}
      </p>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={isAr ? "ابحث عن وصفة..." : "Search recipes..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 40 }}>#</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? "الاسم" : "Name"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, width: 100 }}>Image 1</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, width: 100 }}>Image 2</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, width: 140 }}>Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                  {isAr ? "لا توجد وصفات." : "No recipes."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const flagUrl = cuisineFlagUrl(r.cuisine) || cuisineFlagUrl(r.cuisineAr);
                const activeIsImage2 = !!r.image2Url && r.imageUrl === r.image2Url;

                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {flagUrl && <img src={flagUrl} alt="" style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />}
                        <span style={{ fontWeight: 500 }}>{isAr ? (r.nameAr || r.name) : r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: 8, textAlign: "center" }}>
                      {r.image1Url ? (
                        <img src={r.image1Url} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, border: activeIsImage2 ? "1px solid var(--line)" : "3px solid var(--olive)", opacity: activeIsImage2 ? 0.5 : 1 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, background: "var(--surface-2)", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 11 }}>—</div>
                      )}
                    </td>
                    <td style={{ padding: 8, textAlign: "center" }}>
                      {r.image2Url ? (
                        <img src={r.image2Url} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, border: activeIsImage2 ? "3px solid var(--accent)" : "1px solid var(--line)", opacity: activeIsImage2 ? 1 : 0.5 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, background: "var(--surface-2)", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 11 }}>None</div>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: r.image2Url ? "pointer" : "not-allowed", opacity: r.image2Url ? 1 : 0.4 }}>
                        <input
                          type="checkbox"
                          checked={activeIsImage2}
                          disabled={!r.image2Url}
                          onChange={() => toggleImage(r)}
                          style={{ width: 20, height: 20, cursor: r.image2Url ? "pointer" : "not-allowed", accentColor: "var(--accent)" }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: activeIsImage2 ? "var(--accent)" : "var(--muted)" }}>
                          {activeIsImage2 ? "Image 2" : "Image 1"}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
