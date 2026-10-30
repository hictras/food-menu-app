"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";

export default function LikeButton({ recipeId }: { recipeId: number }) {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visitorId, setVisitorId] = useState("");

  useEffect(() => {
    let vid = localStorage.getItem("visitor_id");
    if (!vid) {
      vid = (crypto.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem("visitor_id", vid);
    }
    setVisitorId(vid);
  }, []);

  useEffect(() => {
    if (!visitorId) return;
    fetch(`/api/recipes/${recipeId}/like?visitorId=${encodeURIComponent(visitorId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === "number") setCount(d.count);
        setLiked(!!d.liked);
      })
      .catch(() => {});
  }, [recipeId, visitorId]);

  async function toggle() {
    if (busy || !visitorId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      const d = await res.json();
      if (res.ok) {
        setCount(d.count);
        setLiked(d.liked);
      }
    } catch {}
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      title={isAr ? "أعجبني" : "Like"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 42,
        padding: "0 14px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: busy ? "wait" : "pointer",
        border: liked ? "1px solid var(--accent)" : "1px solid var(--line)",
        background: liked ? "var(--accent-soft)" : "var(--surface)",
        color: liked ? "var(--accent)" : "var(--ink)",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ fontSize: 16 }}>{liked ? "❤️" : "🤍"}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
    </button>
  );
}
