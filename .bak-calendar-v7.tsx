"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type Slot = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";

type RecipeMini = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
  category: string | null;
  categoryAr: string | null;
};

type PlanEntry = {
  id: number;
  date: string;
  slot: Slot;
  position: number;
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
  { key: "snack", label: "Snack", labelAr: "وجبة خفيفة", color: "#7ba05b" },
  { key: "dessert", label: "Dessert", labelAr: "حلويات", color: "#c94e35" },
];

const MAX_POSITIONS = 2;

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
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [slotMenuDate, setSlotMenuDate] = useState<string | null>(null);
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);
  const [pickerPosition, setPickerPosition] = useState<number | null>(null);
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

  useEffect(() => {
    if (!slotMenuDate) return;
    function closeSlotMenu() {
      setSlotMenuDate(null);
    }
    const timer = setTimeout(() => document.addEventListener("click", closeSlotMenu), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", closeSlotMenu);
    };
  }, [slotMenuDate]);

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

  // Index: date -> slot -> position -> entry
  const byDate = new Map<string, Map<Slot, Map<number, PlanEntry>>>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, new Map());
    const slotMap = byDate.get(e.date)!;
    if (!slotMap.has(e.slot)) slotMap.set(e.slot, new Map());
    slotMap.get(e.slot)!.set(e.position, e);
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

  function openPicker(date: string, slot: Slot, position: number) {
    if (!isAdmin) return;
    setPickerDate(date);
    setPickerSlot(slot);
    setPickerPosition(position);
    setRecipeSearch("");
  }

  function closePicker() {
    setPickerDate(null);
    setPickerSlot(null);
    setPickerPosition(null);
  }

  async function assignRecipe(recipeId: number) {
    if (!pickerDate || !pickerSlot || pickerPosition === null) return;
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: pickerDate,
          slot: pickerSlot,
          position: pickerPosition,
          recipeId,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      closePicker();
      loadMonth();
    } catch (err) {
      alert("Failed to save");
    }
  }

  async function removeEntry(id: number) {
    try {
      const res = await fetch(`/api/meal-plan?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      closePicker();
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

  const pickerCurrentEntry =
    pickerDate && pickerSlot && pickerPosition !== null
      ? byDate.get(pickerDate)?.get(pickerSlot)?.get(pickerPosition) || null
      : null;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{isAr ? "تقويم الوجبات" : "Meal Calendar"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? "اختر حتى وصفتين لكل وجبة في اليوم" : "Up to 2 recipes per slot per day"}
      </p>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {(isAr ? DAY_NAMES_AR : DAY_NAMES_EN).map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", padding: "6px 0" }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = formatDate(year, month, day);
          const dayEntries = byDate.get(date);
          const isToday = date === today;

          const slotFilled = new Map<Slot, PlanEntry[]>();
          if (dayEntries) {
            for (const [slot, posMap] of dayEntries.entries()) {
              slotFilled.set(slot, Array.from(posMap.values()).sort((a, b) => a.position - b.position));
            }
          }
          const hasAny = slotFilled.size > 0;

          return (
            <div
              key={date}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button") || target.closest("a")) return;
                window.location.href = `/calendar/${date}`;
              }}
              style={{
                minHeight: 80,
                minWidth: 0,
                padding: 5,
                background: isToday ? "var(--accent-soft)" : "var(--surface)",
                border: isToday ? "1px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 10,
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: isToday ? "var(--accent)" : "var(--ink)" }}>
                  {day}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSlotMenuDate(slotMenuDate === date ? null : date);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={isAr ? "إضافة" : "Add"}
                    style={{
                      background: "var(--accent)",
                      border: "1px solid var(--accent)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    +
                  </button>
                )}
              </div>

              {hasAny ? (
                SLOTS.map((slot) => {
                  const items = slotFilled.get(slot.key);
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={slot.key} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: slot.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", flex: 1 }}>
                          {isAr ? slot.labelAr : slot.label}
                        </span>
                      </div>
                      {items.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdmin) openPicker(date, slot.key, entry.position);
                            else window.location.href = `/calendar/${date}`;
                          }}
                          title={`${isAr ? slot.labelAr : slot.label} ${entry.position}: ${isAr ? (entry.recipe.nameAr || entry.recipe.name) : entry.recipe.name}`}
                          style={{
                            display: "block",
                            maxWidth: "100%",
                            padding: "2px 4px",
                            borderRadius: 3,
                            background: "var(--bg)",
                            color: "var(--ink)",
                            fontSize: 9,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            borderLeft: `2px solid ${slot.color}`,
                            cursor: "pointer",
                          }}
                        >
                          {isAr ? (entry.recipe.nameAr || entry.recipe.name) : entry.recipe.name}
                        </div>
                      ))}
                    </div>
                  );
                })
              ) : (
                isAdmin && (
                  <div style={{ fontSize: 8, color: "var(--muted)", fontStyle: "italic", marginTop: "auto" }}>
                    {isAr ? "لا وجبات" : "No meals"}
                  </div>
                )
              )}

              {isAdmin && slotMenuDate === date && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    zIndex: 50,
                    background: "var(--surface-solid)",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-lg)",
                    padding: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minWidth: 130,
                  }}
                >
                  {SLOTS.map((slot) => {
                    const positionsUsed = slotFilled.get(slot.key)?.length || 0;
                    const firstEmpty = positionsUsed < 2 ? positionsUsed + 1 : null;
                    return (
                      <button
                        key={slot.key}
                        type="button"
                        disabled={!firstEmpty}
                        onClick={() => {
                          if (!firstEmpty) return;
                          setSlotMenuDate(null);
                          openPicker(date, slot.key, firstEmpty);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          textAlign: "start",
                          padding: "5px 8px",
                          fontSize: 11,
                          color: firstEmpty ? "var(--ink)" : "var(--muted)",
                          cursor: firstEmpty ? "pointer" : "not-allowed",
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        onMouseEnter={(e) => { if (firstEmpty) e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: slot.color }} />
                        {isAr ? slot.labelAr : slot.label}
                        <span style={{ fontSize: 9, color: "var(--muted)", marginInlineStart: "auto" }}>
                          {positionsUsed}/2
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="helper" style={{ marginTop: 16 }}>{isAr ? "جاري التحميل..." : "Loading..."}</p>
      )}

      {pickerDate && pickerSlot && pickerPosition !== null && (
        <div
          onClick={closePicker}
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
                  {SLOTS.find((s) => s.key === pickerSlot)?.[isAr ? "labelAr" : "label"]} · {isAr ? "الوصفة" : "Recipe"} {pickerPosition}
                </div>
              </div>
              <button
                type="button"
                onClick={closePicker}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ×
              </button>
            </div>

            {pickerCurrentEntry && (
              <div style={{ padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                  {isAr ? "الحالي" : "Current"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {pickerCurrentEntry.recipe.imageUrl ? (
                    <img src={pickerCurrentEntry.recipe.imageUrl} alt={pickerCurrentEntry.recipe.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, background: "var(--line)", borderRadius: 6 }} />
                  )}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                    {isAr ? (pickerCurrentEntry.recipe.nameAr || pickerCurrentEntry.recipe.name) : pickerCurrentEntry.recipe.name}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeEntry(pickerCurrentEntry.id)}
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
