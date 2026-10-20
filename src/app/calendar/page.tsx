"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type Slot = "breakfast" | "lunch" | "dinner" | "snack";

type RecipeMini = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
  category: string | null;
  categoryAr: string | null;
};

type PlanEntry = {
  date: string; // YYYY-MM-DD
  slot: Slot;
  recipe: RecipeMini;
};

type RecipeFull = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
  category: string | null;
  categoryAr: string | null;
};

const SLOTS: { key: Slot; label: string; labelAr: string; color: string }[] = [
  { key: "breakfast", label: "Breakfast", labelAr: "فطور", color: "var(--olive)" },
  { key: "lunch", label: "Lunch", labelAr: "غداء", color: "#d97757" },
  { key: "dinner", label: "Dinner", labelAr: "عشاء", color: "var(--accent)" },
  { key: "snack", label: "Snack", labelAr: "وجبة خفيفة", color: "var(--muted)" },
];

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayStr(): string {
  const t = new Date();
  return formatDate(t.getFullYear(), t.getMonth(), t.getDate());
}

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export default function CalendarPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Picker modal state
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);
  const [recipes, setRecipes] = useState<RecipeFull[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.admin))
      .catch(() => setIsAdmin(false));
  }, []);

  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadMonth = useCallback(() => {
    setLoading(true);
    fetch(`/api/meal-plan?month=${monthParam}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [monthParam]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // Load recipes once when picker opens
  useEffect(() => {
    if (pickerDate && recipes.length === 0) {
      fetch("/api/recipes")
        .then((r) => r.json())
        .then((d) => setRecipes(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }, [pickerDate, recipes.length]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = todayStr();

  // Index entries by date
  const byDate = new Map<string, PlanEntry[]>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }
  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  function openPicker(date: string, slot: Slot) {
    if (!isAdmin) return;
    setPickerDate(date);
    setPickerSlot(slot);
    setRecipeSearch("");
  }

  async function assignRecipe(recipeId: number) {
    if (!pickerDate || !pickerSlot) return;
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: pickerDate, slot: pickerSlot, recipeId }),
      });
      if (!res.ok) throw new Error("Save failed");
      setPickerDate(null);
      setPickerSlot(null);
      loadMonth();
    } catch (err) {
      alert("Failed to save");
    }
  }

  async function removeRecipe(date: string, slot: Slot) {
    try {
      const res = await fetch(`/api/meal-plan?date=${date}&slot=${slot}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPickerDate(null);
      setPickerSlot(null);
      loadMonth();
    } catch (err) {
      alert("Failed to remove");
    }
  }

  const filteredRecipes = recipeSearch.trim()
    ? recipes.filter((r) => {
        const q = recipeSearch.toLowerCase();
        return r.name.toLowerCase().includes(q) || (r.nameAr && r.nameAr.includes(recipeSearch));
      })
    : recipes;

  const pickerRecipe = pickerDate && pickerSlot
    ? (byDate.get(pickerDate) || []).find((e) => e.slot === pickerSlot)?.recipe || null
    : null;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{isAr ? "تقويم الوجبات" : "Meal Calendar"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? "اختر وصفة لكل يوم" : "Pick a recipe for each day"}
      </p>

      {/* Header: month nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button type="button" className="btn btn-ghost" onClick={prevMonth} style={{ fontSize: 14, padding: "6px 12px" }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--font-head)", flex: 1, textAlign: "center" }}>
          {isAr ? MONTH_NAMES_AR[month] : MONTH_NAMES_EN[month]} {year}
        </div>
        <button type="button" className="btn btn-ghost" onClick={nextMonth} style={{ fontSize: 14, padding: "6px 12px" }}>→</button>
        <button type="button" className="btn btn-ghost" onClick={goToday} style={{ fontSize: 12, padding: "6px 12px" }}>
          {isAr ? "اليوم" : "Today"}
        </button>
      </div>

      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {(isAr ? DAY_NAMES_AR : DAY_NAMES_EN).map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", padding: "6px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = formatDate(year, month, day);
          const dayEntries = byDate.get(date) || [];
          const isToday = date === today;
          const entryBySlot = new Map<Slot, PlanEntry>();
          for (const e of dayEntries) entryBySlot.set(e.slot, e);

          return (
            <div
              key={date}
              style={{
                minHeight: 90,
                padding: 6,
                background: isToday ? "var(--accent-soft)" : "var(--surface)",
                border: isToday ? "1px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 3,
                fontSize: 11,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: isToday ? "var(--accent)" : "var(--ink)" }}>
                  {day}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openPicker(date, "dinner")}
                    title={isAr ? "إضافة" : "Add"}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                )}
              </div>

              {SLOTS.map((slot) => {
                const entry = entryBySlot.get(slot.key);
                if (!entry) return null;
                return (
                  <Link
                    key={slot.key}
                    href={`/recipes/${entry.recipe.id}`}
                    style={{
                      display: "block",
                      padding: "3px 5px",
                      borderRadius: 4,
                      background: "var(--bg)",
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontSize: 10,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      borderLeft: `3px solid ${slot.color}`,
                    }}
                    onClick={(e) => {
                      if (isAdmin && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        openPicker(date, slot.key);
                      }
                    }}
                    title={`${isAr ? slot.labelAr : slot.label}: ${isAr ? (entry.recipe.nameAr || entry.recipe.name) : entry.recipe.name}`}
                  >
                    {isAr ? (entry.recipe.nameAr || entry.recipe.name) : entry.recipe.name}
                  </Link>
                );
              })}

              {dayEntries.length === 0 && isAdmin && (
                <div style={{ fontSize: 9, color: "var(--muted)", fontStyle: "italic", marginTop: "auto" }}>
                  {isAr ? "اضغط +" : "Click +"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="helper" style={{ marginTop: 16 }}>{isAr ? "جاري التحميل..." : "Loading..."}</p>
      )}

      {/* Picker modal */}
      {pickerDate && pickerSlot && (
        <div
          onClick={() => { setPickerDate(null); setPickerSlot(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface-solid)",
              border: "1px solid var(--line-strong)",
              borderRadius: 12,
              padding: 20,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                  {pickerDate}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                  {SLOTS.find((s) => s.key === pickerSlot)?.[isAr ? "labelAr" : "label"]}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPickerDate(null); setPickerSlot(null); }}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ×
              </button>
            </div>

            {pickerRecipe && (
              <div style={{ padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                  {isAr ? "الوصفة الحالية" : "Current recipe"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {pickerRecipe.imageUrl ? (
                    <img src={pickerRecipe.imageUrl} alt={pickerRecipe.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, background: "var(--line)", borderRadius: 6 }} />
                  )}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                    {isAr ? (pickerRecipe.nameAr || pickerRecipe.name) : pickerRecipe.name}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeRecipe(pickerDate, pickerSlot)}
                    style={{ fontSize: 11, padding: "4px 10px" }}
                  >
                    {isAr ? "حذف" : "Remove"}
                  </button>
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder={isAr ? "ابحث عن وصفة..." : "Search recipes..."}
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
              autoFocus
            />

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {filteredRecipes.length === 0 ? (
                <p className="helper">{isAr ? "لا وصفات" : "No recipes"}</p>
              ) : (
                filteredRecipes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => assignRecipe(r.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 8,
                      background: "transparent",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: "var(--ink)",
                      textAlign: "start",
                      fontSize: 13,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 36, height: 36, background: "var(--line)", borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{isAr ? (r.nameAr || r.name) : r.name}</div>
                      {r.category && (
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {isAr ? (r.categoryAr || r.category) : r.category}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
