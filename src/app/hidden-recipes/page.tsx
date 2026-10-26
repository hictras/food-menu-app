"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";
import { cuisineFlagUrl } from "@/lib/cuisine-flag";
import { CATEGORIES } from "@/lib/categories";

type Recipe = {
    id: number;
    name: string;
    nameAr: string | null;
    category: string | null;
    categoryAr: string | null;
    cuisine: string | null;
    cuisineAr: string | null;
    isHidden: number;
};

export default function HiddenRecipesPage() {
    const { lang } = useLang();
    const isAr = lang === "ar";
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

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

    async function toggleHidden(recipe: Recipe) {
        const newState = recipe.isHidden === 1 ? 0 : 1;
        await fetch(`/api/recipes/${recipe.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...recipe, isHidden: newState }),
        });
        setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, isHidden: newState } : r));
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = recipes.filter(r => {
            const name = (isAr ? (r.nameAr || r.name) : r.name).toLowerCase();
            const category = isAr ? (r.categoryAr || r.category) : r.category;
            if (q && !name.includes(q)) return false;
            if (categoryFilter && category !== categoryFilter && r.category !== categoryFilter && r.categoryAr !== categoryFilter) return false;
            return true;
        });

        // Sort: Hidden first (1), then visible (0)
        return [...list].sort((a, b) => {
            const aHidden = a.isHidden === 1 ? 1 : 0;
            const bHidden = b.isHidden === 1 ? 1 : 0;
            // Descending order (1 comes before 0)
            return bHidden - aHidden;
        });
    }, [recipes, query, categoryFilter, isAr]);

    if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.hiddenRecipes.loading : "Loading..."}</div>;

    return (
        <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
            <div className="page-head">
                <h1>{isAr ? ar.hiddenRecipes.title : "Hidden Recipes"}</h1>
            </div>
            <p className="page-sub">
                {isAr ? ar.hiddenRecipes.subtitle : "Select recipes to hide from the menu"}
            </p>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: 16 }}>
                <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={isAr ? ar.hiddenRecipes.searchPlaceholder : "Search recipes..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">{isAr ? ar.hiddenRecipes.allCategories : "All categories"}</option>
                    {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>
                            {c.icon} {isAr ? c.valueAr : c.value}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
                        <tr>
                            <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>#</th>
                            <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.hiddenRecipes.name : "Name"}</th>
                            <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.hiddenRecipes.category : "Category"}</th>
                            <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>{isAr ? ar.hiddenRecipes.status : "Status"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                                    {isAr ? ar.hiddenRecipes.noRecipes : "No recipes."}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r, i) => {
                                const flagUrl = cuisineFlagUrl(r.cuisine) || cuisineFlagUrl(r.cuisineAr);
                                return (
                                    <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                                        <td style={{ padding: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                                        <td style={{ padding: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {flagUrl && <img src={flagUrl} alt="" style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />}
                                                <span style={{ fontWeight: 500 }}>{isAr ? (r.nameAr || r.name) : r.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: 12, color: "var(--muted)" }}>
                                            {isAr ? (r.categoryAr || r.category) : r.category}
                                        </td>
                                        <td style={{ padding: 12, textAlign: "center" }}>
                                            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={r.isHidden === 1}
                                                    onChange={() => toggleHidden(r)}
                                                    style={{ width: 18, height: 18, cursor: "pointer" }}
                                                />
                                                <span style={{ fontSize: 12, color: r.isHidden === 1 ? "var(--accent)" : "var(--olive)", fontWeight: 600 }}>
                                                    {r.isHidden === 1 ? (isAr ? ar.hiddenRecipes.hidden : "Hidden") : (isAr ? ar.hiddenRecipes.visible : "Visible")}
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