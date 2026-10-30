"use client";
import { useMemo } from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";
import DayReviews from "@/components/DayReviews";

type Slot = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";

type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  category: string | null;
  categoryAr: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
};

type Entry = {
  id: number;
  date: string;
  slot: Slot;
  position: number;
  recipe: Recipe;
};

const SLOTS: { key: Slot; label: string; labelAr: string; color: string }[] = [
  { key: "breakfast", label: "Breakfast", labelAr: ar.calendar.slots.breakfast, color: "var(--olive)" },
  { key: "lunch", label: "Lunch", labelAr: ar.calendar.slots.lunch, color: "#d97757" },
  { key: "dinner", label: "Dinner", labelAr: ar.calendar.slots.dinner, color: "var(--accent)" },
  { key: "snack", label: "Snack", labelAr: ar.calendar.slots.snack, color: "#7ba05b" },
  { key: "dessert", label: "Dessert", labelAr: ar.calendar.slots.dessert, color: "#c94e35" },
];

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayStatus(dateStr: string): "past" | "today" | "future" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  if (target < today) return "past";
  if (target.getTime() === today.getTime()) return "today";
  return "future";
}

function formatLongDate(dateStr: string, lang: "en" | "ar"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  
  if (lang === "ar") {
    const dayName = ar.calendar.days[date.getDay()];
    const monthName = ar.calendar.months[m - 1];
    return `${dayName}، ${d} ${monthName} ${y}`;
  } else {
    const dayName = DAY_NAMES_EN[date.getDay()];
    const monthName = MONTH_NAMES_EN[m - 1];
    return `${dayName}, ${monthName} ${d}, ${y}`;
  }
}

export default function DayPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const params = useParams();
  const dateStr = params?.date as string;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [likeMap, setLikeMap] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [visitorId, setVisitorId] = useState<string>("");


  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setIsAdmin(d.admin)).catch(() => {});
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setLoading(false);
      return;
    }
    
    // The API now returns { entries: [...] } instead of just an array
    fetch(`/api/meal-plan?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dateStr]);

  useEffect(() => {
    let vid = localStorage.getItem("visitor_id");
    if (!vid) {
      vid = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem("visitor_id", vid);
    }
    setVisitorId(vid);
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    const ids = Array.from(new Set(entries.map((e) => e.recipe.id)));
    const qs = new URLSearchParams({ ids: ids.join(","), ...(visitorId ? { visitorId } : {}) });
    fetch(`/api/recipes/likes?${qs.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d && typeof d === "object") setLikeMap(d); })
      .catch(() => {});
  }, [entries, visitorId]);

  function getShiftedDate(days: number) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, "0");
    const nd = String(date.getDate()).padStart(2, "0");
    return `${ny}-${nm}-${nd}`;
  }

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return (
      <main className="container" style={{ paddingTop: 40 }}>
        <div className="empty">
          <h2>{isAr ? ar.calendar.invalidDate : "Invalid date"}</h2>
          <Link href="/calendar" className="btn btn-primary">
            {isAr ? ar.calendar.backToCalendar : "← Back to calendar"}
          </Link>
        </div>
      </main>
    );
  }

  const status = getDayStatus(dateStr);
  const longDate = formatLongDate(dateStr, lang);

  const statusText = isAr
    ? (status === "past"
        ? `${ar.calendar.servedOn} ${longDate}`
        : status === "today"
          ? `${ar.calendar.toBeServedToday} ${longDate}`
          : `${ar.calendar.toBeServedOn} ${longDate}`)
    : (status === "past"
        ? `Served on ${longDate}`
        : status === "today"
          ? `To be served today, ${longDate}`
          : `To be served on ${longDate}`);

  const statusColor =
    status === "past" ? "var(--muted)" :
    status === "today" ? "var(--accent)" :
    "var(--olive)";

  const bySlot = new Map<Slot, Entry[]>();
  for (const e of entries) {
    if (!bySlot.has(e.slot)) bySlot.set(e.slot, []);
    bySlot.get(e.slot)!.push(e);
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Link href="/calendar" className="btn btn-ghost" style={{ fontSize: "0.75rem" }}>
          {isAr ? ar.calendar.backToCalendar : "← Calendar"}
        </Link>
        
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/calendar/${getShiftedDate(-1)}`} className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
            {isAr ? ar.calendar.prevDay : "← Prev Day"}
          </Link>
          <Link href={`/calendar/${getShiftedDate(1)}`} className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
            {isAr ? ar.calendar.nextDay : "Next Day →"}
          </Link>
        </div>
      </div>

      <div className="page-head">
        <h1>{longDate}</h1>
      </div>
      <p className="page-sub" style={{ color: statusColor, fontWeight: 600 }}>
        {statusText}
      </p>

      {loading ? (
        <p className="helper">{isAr ? ar.calendar.loading : "Loading..."}</p>
      ) : entries.length === 0 ? (
        <div className="empty">
          <h2>{isAr ? ar.calendar.noMeals : "No meals planned"}</h2>
          <p>{isAr ? ar.calendar.noRecipesForDay : "No recipes assigned to this day."}</p>
          <Link href="/calendar" className="btn btn-primary">
            {isAr ? ar.calendar.backToCalendar : "← Back to calendar"}
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
          {SLOTS.map((slot) => {
            const slotEntries = bySlot.get(slot.key) || [];
            if (slotEntries.length === 0) return null;

            return (
              <section key={slot.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: slot.color }} />
                  <h2 style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink)" }}>
                    {isAr ? slot.labelAr : slot.label}
                  </h2>
                  <span style={{ fontSize: "0.6875rem", color: "var(--muted)", marginInlineStart: "auto" }}>
                    {slotEntries.length} {isAr ? ar.calendar.recipes : slotEntries.length === 1 ? "recipe" : "recipes"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {slotEntries.map((entry) => {
                    const name = isAr ? (entry.recipe.nameAr || entry.recipe.name) : entry.recipe.name;
                    const desc = isAr ? (entry.recipe.descriptionAr || entry.recipe.description) : entry.recipe.description;
                    const category = isAr ? (entry.recipe.categoryAr || entry.recipe.category) : entry.recipe.category;
                    return (
                      <Link key={entry.id} href={`/recipes/${entry.recipe.id}`} style={{ display: "flex", gap: 14, padding: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", textDecoration: "none", color: "inherit", transition: "border-color 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}>
                        {entry.recipe.imageUrl ? (
                          <img src={entry.recipe.imageUrl} alt={name} loading="lazy" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 100, height: 100, background: "var(--line)", borderRadius: 8, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{name}</h3>
                            {category && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "var(--surface-2)", color: "var(--muted)", whiteSpace: "nowrap" }}>{category}</span>}
                          </div>
                          {desc && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-soft)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{desc}</p>}
                          <div style={{ fontSize: "0.6875rem", color: "var(--muted)", display: "flex", gap: 12, marginTop: "auto", fontVariantNumeric: "tabular-nums", alignItems: "center", flexWrap: "wrap" }}>
                            <span>⏱ {entry.recipe.prepTime + entry.recipe.cookTime} {isAr ? ar.detail.min : "min"}</span>
                            <span>🍽 {entry.recipe.servings}</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!visitorId) return;
                                const res = await fetch(`/api/recipes/${entry.recipe.id}/like`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ visitorId }),
                                });
                                if (res.ok) {
                                  const d = await res.json();
                                  setLikeMap((prev) => ({ ...prev, [String(entry.recipe.id)]: { count: d.count, liked: d.liked } }));
                                }
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: "pointer",
                                border: (likeMap[String(entry.recipe.id)]?.liked) ? "1px solid var(--accent)" : "1px solid var(--line)",
                                background: (likeMap[String(entry.recipe.id)]?.liked) ? "var(--accent-soft)" : "var(--surface-2)",
                                color: (likeMap[String(entry.recipe.id)]?.liked) ? "var(--accent)" : "var(--muted)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              <span style={{ fontSize: 12 }}>{(likeMap[String(entry.recipe.id)]?.liked) ? "❤️" : "🤍"}</span>
                              <span>{likeMap[String(entry.recipe.id)]?.count ?? 0}</span>
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {dateStr && (
        <DayReviews date={dateStr} isAdmin={isAdmin} />
      )}
    </main>
  );
}
