"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

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
  { key: "breakfast", label: "Breakfast", labelAr: "فطور", color: "var(--olive)" },
  { key: "lunch", label: "Lunch", labelAr: "غداء", color: "#d97757" },
  { key: "dinner", label: "Dinner", labelAr: "عشاء", color: "var(--accent)" },
  { key: "snack", label: "Snack", labelAr: "وجبة خفيفة", color: "#7ba05b" },
  { key: "dessert", label: "Dessert", labelAr: "حلويات", color: "#c94e35" },
];

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

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
  const dayName = lang === "ar" ? DAY_NAMES_AR[date.getDay()] : DAY_NAMES_EN[date.getDay()];
  const monthName = lang === "ar" ? MONTH_NAMES_AR[m - 1] : MONTH_NAMES_EN[m - 1];
  if (lang === "ar") {
    return `${dayName}، ${d} ${monthName} ${y}`;
  }
  return `${dayName}, ${monthName} ${d}, ${y}`;
}

export default function DayPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const params = useParams();
  const dateStr = params?.date as string;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setLoading(false);
      return;
    }
    fetch(`/api/meal-plan?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dateStr]);

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return (
      <main className="container" style={{ paddingTop: 40 }}>
        <div className="empty">
          <h2>{isAr ? "تاريخ غير صالح" : "Invalid date"}</h2>
          <Link href="/calendar" className="btn btn-primary">
            {isAr ? "← العودة إلى التقويم" : "← Back to calendar"}
          </Link>
        </div>
      </main>
    );
  }

  const status = getDayStatus(dateStr);
  const longDate = formatLongDate(dateStr, lang);

  const statusText = isAr
    ? (status === "past"
        ? `قُدّم يوم ${longDate}`
        : status === "today"
          ? `سيُقدّم اليوم، ${longDate}`
          : `سيُقدّم يوم ${longDate}`)
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
      <div style={{ marginBottom: 20 }}>
        <Link href="/calendar" className="btn btn-ghost" style={{ fontSize: 12 }}>
          {isAr ? "← التقويم" : "← Calendar"}
        </Link>
      </div>

      <div className="page-head">
        <h1>{longDate}</h1>
      </div>
      <p className="page-sub" style={{ color: statusColor, fontWeight: 600 }}>
        {statusText}
      </p>

      {loading ? (
        <p className="helper">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : entries.length === 0 ? (
        <div className="empty">
          <h2>{isAr ? "لا وجبات" : "No meals planned"}</h2>
          <p>{isAr ? "لم يتم تعيين وصفات لهذا اليوم." : "No recipes assigned to this day."}</p>
          <Link href="/calendar" className="btn btn-primary">
            {isAr ? "← العودة إلى التقويم" : "← Back to calendar"}
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
          {SLOTS.map((slot) => {
            const slotEntries = bySlot.get(slot.key) || [];
            if (slotEntries.length === 0) return null;

            return (
              <section key={slot.key}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--line)",
                }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: slot.color }} />
                  <h2 style={{
                    margin: 0,
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ink)",
                  }}>
                    {isAr ? slot.labelAr : slot.label}
                  </h2>
                  <span style={{ fontSize: 11, color: "var(--muted)", marginInlineStart: "auto" }}>
                    {slotEntries.length} {isAr ? "وصفة" : slotEntries.length === 1 ? "recipe" : "recipes"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {slotEntries.map((entry) => {
                    const name = isAr ? (entry.recipe.nameAr || entry.recipe.name) : entry.recipe.name;
                    const desc = isAr ? (entry.recipe.descriptionAr || entry.recipe.description) : entry.recipe.description;
                    const category = isAr ? (entry.recipe.categoryAr || entry.recipe.category) : entry.recipe.category;
                    return (
                      <Link
                        key={entry.id}
                        href={`/recipes/${entry.recipe.id}`}
                        style={{
                          display: "flex",
                          gap: 14,
                          padding: 12,
                          background: "var(--surface)",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius)",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
                      >
                        {entry.recipe.imageUrl ? (
                          <img
                            src={entry.recipe.imageUrl}
                            alt={name}
                            loading="lazy"
                            style={{
                              width: 100,
                              height: 100,
                              objectFit: "cover",
                              borderRadius: 8,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 100,
                            height: 100,
                            background: "var(--line)",
                            borderRadius: 8,
                            flexShrink: 0,
                          }} />
                        )}

                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <h3 style={{
                              margin: 0,
                              fontSize: 15,
                              fontWeight: 600,
                              color: "var(--ink)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}>
                              {name}
                            </h3>
                            {category && (
                              <span style={{
                                fontSize: 10,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "var(--surface-2)",
                                color: "var(--muted)",
                                whiteSpace: "nowrap",
                              }}>
                                {category}
                              </span>
                            )}
                          </div>

                          {desc && (
                            <p style={{
                              margin: 0,
                              fontSize: 12,
                              color: "var(--ink-soft)",
                              lineHeight: 1.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}>
                              {desc}
                            </p>
                          )}

                          <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 12, marginTop: "auto", fontVariantNumeric: "tabular-nums" }}>
                            <span>⏱ {entry.recipe.prepTime + entry.recipe.cookTime} {isAr ? "د" : "min"}</span>
                            <span>🍽 {entry.recipe.servings}</span>
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
    </main>
  );
}
