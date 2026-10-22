"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type Slot = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";

type RecipeMini = {
  id: number;
  name: string;
  nameAr: string | null;
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

const SLOTS: { key: Slot; label: string; labelAr: string; color: string }[] = [
  { key: "breakfast", label: "Breakfast", labelAr: ar.calendar.slots.breakfast, color: "var(--olive)" },
  { key: "lunch", label: "Lunch", labelAr: ar.calendar.slots.lunch, color: "#d97757" },
  { key: "dinner", label: "Dinner", labelAr: ar.calendar.slots.dinner, color: "var(--accent)" },
  { key: "snack", label: "Snack", labelAr: ar.calendar.slots.snack, color: "#7ba05b" },
  { key: "dessert", label: "Dessert", labelAr: ar.calendar.slots.dessert, color: "#c94e35" },
];

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d: Date): string {
  return fmt(d.getFullYear(), d.getMonth(), d.getDate());
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function monthParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function WeeklySummaryPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const search = useSearchParams();

  const fromParam = search.get("from");
  const weekStart = useMemo(() => {
    if (fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam)) {
      return mondayOf(parseDate(fromParam));
    }
    return mondayOf(new Date());
  }, [fromParam]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    const months = new Set([monthParam(weekStart), monthParam(weekEnd)]);
    setLoading(true);
    Promise.all(
      Array.from(months).map((m) =>
        fetch(`/api/meal-plan?month=${m}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    )
      .then((lists) => {
        const merged: PlanEntry[] = [];
        const seen = new Set<number>();
        for (const list of lists) {
          if (!Array.isArray(list)) continue;
          for (const e of list as PlanEntry[]) {
            if (seen.has(e.id)) continue;
            seen.add(e.id);
            merged.push(e);
          }
        }
        setEntries(merged);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.logo_url) setLogoUrl(d.logo_url); })
      .catch(() => {});
  }, [weekStart, weekEnd]);

  const byDate = useMemo(() => {
    const map = new Map<string, Map<Slot, PlanEntry[]>>();
    const startStr = toStr(weekStart);
    const endStr = toStr(weekEnd);
    for (const e of entries) {
      if (e.date < startStr || e.date > endStr) continue;
      if (!map.has(e.date)) map.set(e.date, new Map());
      const slotMap = map.get(e.date)!;
      if (!slotMap.has(e.slot)) slotMap.set(e.slot, []);
      slotMap.get(e.slot)!.push(e);
    }
    for (const slotMap of map.values()) {
      for (const list of slotMap.values()) list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [entries, weekStart, weekEnd]);

  function recipeName(e: PlanEntry): string {
    return isAr ? (e.recipe.nameAr || e.recipe.name) : e.recipe.name;
  }

  function rangeLabel(): string {
    const y1 = weekStart.getFullYear();
    const y2 = weekEnd.getFullYear();
    const m1 = weekStart.getMonth();
    const m2 = weekEnd.getMonth();
    const d1 = weekStart.getDate();
    const d2 = weekEnd.getDate();

    if (isAr) {
      const m1n = MONTH_NAMES_AR[m1];
      const m2n = MONTH_NAMES_AR[m2];
      if (y1 === y2 && m1 === m2) return `${d1} – ${d2} ${m1n} ${y1}`;
      if (y1 === y2) return `${d1} ${m1n} – ${d2} ${m2n} ${y1}`;
      return `${d1} ${m1n} ${y1} – ${d2} ${m2n} ${y2}`;
    }
    const m1n = MONTH_NAMES_EN[m1];
    const m2n = MONTH_NAMES_EN[m2];
    if (y1 === y2 && m1 === m2) return `${m1n} ${d1} – ${d2}, ${y1}`;
    if (y1 === y2) return `${m1n} ${d1} – ${m2n} ${d2}, ${y1}`;
    return `${m1n} ${d1}, ${y1} – ${m2n} ${d2}, ${y2}`;
  }

  function buildWhatsAppText(): string {
    const lines: string[] = [];
    lines.push(isAr ? `🗓 *${ar.weeklySummary.title}*` : "🗓 *This Week's Menu*");
    lines.push(rangeLabel());
    lines.push("");

    let any = false;
    for (const day of days) {
      const dateStr = toStr(day);
      const slotMap = byDate.get(dateStr);
      if (!slotMap || slotMap.size === 0) continue;
      any = true;
      const dayName = isAr ? DAY_NAMES_AR[day.getDay()] : DAY_NAMES_EN[day.getDay()];
      lines.push(`*${dayName}*`);
      for (const slot of SLOTS) {
        const list = slotMap.get(slot.key);
        if (!list) continue;
        for (const e of list) {
          const slotLabel = isAr ? slot.labelAr : slot.label;
          lines.push(`  ${slotLabel}: ${recipeName(e)}`);
        }
      }
      lines.push("");
    }
    if (!any) lines.push(isAr ? ar.weeklySummary.empty : "No meals planned this week.");
    lines.push(isAr ? `— ${ar.weeklySummary.sharedFrom}` : "— Shared from Menu");
    return lines.join("\n");
  }

  function share() {
    const text = buildWhatsAppText();
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 760 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href="/calendar" className="btn btn-ghost" style={{ fontSize: 12 }}>
          {isAr ? ar.calendar.backToCalendar : "← Calendar"}
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/week?from=${toStr(addDays(weekStart, -7))}`} className="btn btn-ghost" style={{ fontSize: 12 }}>
            {isAr ? "→ الأسبوع السابق" : "← Prev week"}
          </Link>
          <Link href={`/week?from=${toStr(addDays(weekStart, 7))}`} className="btn btn-ghost" style={{ fontSize: 12 }}>
            {isAr ? "الأسبوع التالي ←" : "Next week →"}
          </Link>
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 0 }}>
        <h1>{isAr ? ar.weeklySummary.title : "This Week's Menu"}</h1>
      </div>
      <p className="page-sub">{rangeLabel()}</p>

      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          🖨 {isAr ? ar.weeklySummary.print : "Print"}
        </button>
        <button type="button" className="btn btn-primary" onClick={share}>
          💬 {isAr ? ar.weeklySummary.share : "Share on WhatsApp"}
        </button>
      </div>

      {loading ? (
        <p className="helper">{isAr ? ar.calendar.loading : "Loading..."}</p>
      ) : (
        <div className="week-summary">
          {days.map((day) => {
            const dateStr = toStr(day);
            const slotMap = byDate.get(dateStr);
            const dayName = isAr ? DAY_NAMES_AR[day.getDay()] : DAY_NAMES_EN[day.getDay()];
            const hasMeals = slotMap && slotMap.size > 0;

            return (
              <div key={dateStr} className="week-day">
                <div className="week-day-name">{dayName}</div>
                <div className="week-day-meals">
                  {!hasMeals && (
                    <span className="week-day-empty">—</span>
                  )}
                  {hasMeals && SLOTS.map((slot) => {
                    const list = slotMap!.get(slot.key);
                    if (!list || list.length === 0) return null;
                    return (
                      <div key={slot.key} className="week-slot">
                        <span className="week-slot-dot" style={{ background: slot.color }} />
                        <span className="week-slot-label">{isAr ? slot.labelAr : slot.label}:</span>
                        <span className="week-slot-recipes">
                          {list.map((e, idx) => (
                            <span key={e.id}>
                              {idx > 0 && <span className="week-slot-sep"> · </span>}
                              <Link href={`/recipes/${e.recipe.id}`} className="week-recipe-link">
                                {recipeName(e)}
                              </Link>
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="week-footer">
        {logoUrl && <img src={logoUrl} alt="" className="week-logo" />}
        <span>{isAr ? ar.weeklySummary.sharedFrom : "Shared from Menu"}</span>
      </div>
    </main>
  );
}
