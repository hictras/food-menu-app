"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";
import { pick } from "@/lib/i18n";

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

export default function CookMode({ open, onClose, recipeName, steps }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [index, setIndex] = useState(0);
  const [wakeStatus, setWakeStatus] = useState<"idle" | "on" | "unsupported" | "denied">("idle");
  const wakeRef = useRef<any>(null);

  // reset to first step when opened
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // wake lock: acquire on open, release on close
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function acquire() {
      if (!("wakeLock" in navigator)) {
        setWakeStatus("unsupported");
        return;
      }
      try {
        const sentinel = await (navigator as any).wakeLock.request("screen");
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
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

    // re-acquire when tab becomes visible again (browsers drop the lock on hide)
    function onVisible() {
      if (document.visibilityState === "visible" && open && !wakeRef.current) {
        acquire();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (wakeRef.current) {
        wakeRef.current.release().catch(() => {});
        wakeRef.current = null;
      }
      setWakeStatus("idle");
    };
  }, [open]);

  // keyboard navigation
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

  return (
    <div className="cook-overlay" role="dialog" aria-modal="true" aria-label="Cook mode">
      <div className="cook-top">
        <button
          type="button"
          className="cook-close"
          onClick={onClose}
          aria-label={isAr ? "خروج" : "Exit"}
        >
          ✕ {isAr ? "خروج" : "Exit"}
        </button>

        <div className="cook-wake-status">
          {wakeStatus === "on" && (isAr ? "📱 الشاشة تبقى مضاءة" : "📱 Screen stays on")}
          {wakeStatus === "unsupported" && (isAr ? "📱 اجعل الشاشة مضاءة يدوياً" : "📱 Keep screen on manually")}
          {wakeStatus === "denied" && (isAr ? "📱 اجعل الشاشة مضاءة يدوياً" : "📱 Keep screen on manually")}
        </div>
      </div>

      <div className="cook-recipe-name">{recipeName}</div>

      <div className="cook-step-container" onClick={() => !isLast && setIndex((i) => i + 1)}>
        <div className="cook-step-number">
          {isAr
            ? `${ar.cookMode.step} ${index + 1} ${ar.cookMode.of} ${steps.length}`
            : `Step ${index + 1} of ${steps.length}`}
        </div>
        <div className="cook-step-text">{text}</div>
      </div>

      <div className="cook-nav">
        <button
          type="button"
          className="cook-nav-btn"
          disabled={isFirst}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {isAr ? "→ السابق" : "← Prev"}
        </button>
        {isLast ? (
          <button type="button" className="cook-nav-btn cook-nav-done" onClick={onClose}>
            {isAr ? "✓ تم" : "✓ Done"}
          </button>
        ) : (
          <button
            type="button"
            className="cook-nav-btn cook-nav-next"
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          >
            {isAr ? "التالي ←" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}
