"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";
import { pick } from "@/lib/i18n";
import KitchenTimer from "./KitchenTimer";

type Step = {
  id: number;
  stepNumber: number;
  text: string;
  textAr: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  recipeName: string;
  steps: Step[];
};

type TimerState = {
  seconds: number;
  brief: string;
} | null;

export default function CookMode({ open, onClose, recipeName, steps }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [index, setIndex] = useState(0);
  const [wakeStatus, setWakeStatus] = useState<"idle" | "on" | "unsupported" | "denied">("idle");
  const wakeRef = useRef<any>(null);
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState<TimerState>(null);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function acquire() {
      if (!("wakeLock" in navigator)) { setWakeStatus("unsupported"); return; }
      try {
        const sentinel = await (navigator as any).wakeLock.request("screen");
        if (cancelled) { sentinel.release().catch(() => {}); return; }
        wakeRef.current = sentinel;
        setWakeStatus("on");
        sentinel.addEventListener("release", () => {
          if (wakeRef.current === sentinel) {
            wakeRef.current = null;
            if (!cancelled) setWakeStatus("denied");
          }
        });
      } catch {
        if (!cancelled) setWakeStatus("denied");
      }
    }
    acquire();
    function onVisible() {
      if (document.visibilityState === "visible" && open && !wakeRef.current) acquire();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (wakeRef.current) { wakeRef.current.release().catch(() => {}); wakeRef.current = null; }
      setWakeStatus("idle");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < steps.length - 1) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, steps.length, onClose]);

  if (!open || steps.length === 0) return null;

  const current = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const text = pick(lang, current.text, current.textAr);

  // Helper to extract a brief title from the step text (first 3-5 words)
  function getBrief(t: string) {
    const words = t.split(" ").slice(0, 4).join(" ");
    return words + "...";
  }

  function renderTextWithTimers(t: string) {
    const regex = /(\d+)\s*(minutes|minute|hours|hour|hrs|hr|mins|min|دقيقة|دقائق|ساعة|ساعات)\b/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(t)) !== null) {
      if (match.index > lastIndex) parts.push(t.slice(lastIndex, match.index));
      
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const isHour = unit.includes("hour") || unit.includes("hr") || unit.includes("ساعة");
      const seconds = isHour ? amount * 3600 : amount * 60;
      const brief = isAr ? `الخطوة ${index + 1}` : `Step ${index + 1}: ${getBrief(t)}`;

      parts.push(
        <button
          key={match.index}
          onClick={(e) => { e.stopPropagation(); setActiveTimer({ seconds, brief }); }}
          style={{ background: "rgba(255,107,74,0.2)", border: "1px solid #ff6b4a", color: "#ff6b4a", padding: "2px 8px", borderRadius: 6, margin: "0 4px", fontWeight: 700, fontSize: "0.8em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          ⏱ {match[0]}
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < t.length) parts.push(t.slice(lastIndex));
    return parts;
  }

  return (
    <>
      <div className="cook-overlay" role="dialog" aria-modal="true" style={{ display: "flex", position: "fixed", inset: 0, zIndex: 999, background: "#000", color: "#fff", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
        
        {/* Fixed Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #222", flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
            ✕ {isAr ? "خروج" : "Exit"}
          </button>
          <div style={{ fontSize: 12, color: "#3fb950", whiteSpace: "nowrap" }}>
            {wakeStatus === "on" && (isAr ? "📱 الشاشة تبقى مضاءة" : "📱 Screen stays on")}
            {(wakeStatus === "unsupported" || wakeStatus === "denied") && (isAr ? "📱 اجعل الشاشة مضاءة يدوياً" : "📱 Keep screen on manually")}
          </div>
        </div>

        {/* Fixed Title & Step Tracker */}
        <div style={{ flexShrink: 0, textAlign: "center", padding: "24px 20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, maxWidth: "90%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {recipeName}
          </h1>
          <div style={{ background: "rgba(255,107,74,0.15)", color: "#ff6b4a", border: "1px solid rgba(255,107,74,0.3)", padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isAr ? `الخطوة ${index + 1} من ${steps.length}` : `Step ${index + 1} of ${steps.length}`}
          </div>
        </div>

        {/* Scrollable Text */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px 24px", overflowY: "auto" }}>
          <div style={{ fontSize: "clamp(24px, 6vw, 36px)", lineHeight: 1.4, fontWeight: 500, maxWidth: 900, textAlign: "center", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 4px" }}>
            {renderTextWithTimers(text)}
          </div>
        </div>

        {/* Fixed Bottom Nav */}
        <div style={{ flexShrink: 0, display: "flex", gap: 12, padding: 20, borderTop: "1px solid #222", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0))" }}>
          <button type="button" disabled={isFirst} onClick={() => setIndex((i) => Math.max(0, i - 1))} style={{ flex: 1, padding: "20px 16px", fontSize: 18, fontWeight: 700, borderRadius: 12, border: "1px solid #333", background: "#1a1a1a", color: "#fff", cursor: isFirst ? "not-allowed" : "pointer", opacity: isFirst ? 0.3 : 1 }}>
            {isAr ? "→ السابق" : "← Prev"}
          </button>
          
          {isLast ? (
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "20px 16px", fontSize: 18, fontWeight: 700, borderRadius: 12, border: "1px solid #3fb950", background: "#3fb950", color: "#fff", cursor: "pointer" }}>
              {isAr ? "✓ تم" : "✓ Done"}
            </button>
          ) : (
            <button type="button" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} style={{ flex: 1, padding: "20px 16px", fontSize: 18, fontWeight: 700, borderRadius: 12, border: "1px solid #ff6b4a", background: "#ff6b4a", color: "#fff", cursor: "pointer" }}>
              {isAr ? "التالي ←" : "Next →"}
            </button>
          )}
        </div>
      </div>

      {activeTimer && (
        <KitchenTimer 
          seconds={activeTimer.seconds} 
          brief={activeTimer.brief}
          onClose={() => setActiveTimer(null)} 
          onNextStep={!isLast ? () => { setActiveTimer(null); setIndex((i) => i + 1); } : undefined}
        />
      )}
    </>
  );
}
