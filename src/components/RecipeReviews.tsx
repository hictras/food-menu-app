"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  updatedAt: string;
  name: string | null;
};

type Data = {
  average: number;
  count: number;
  mine: { rating: number; comment: string | null } | null;
  reviews: Review[];
};

export default function RecipeReviews({ recipeId }: { recipeId: number }) {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Phone verification state
  const [hasPhone, setHasPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Check if they have a phone cookie
  useEffect(() => {
    setHasPhone(document.cookie.includes("viewer_phone="));
  }, []);

  function load() {
    setLoading(true);
    fetch(`/api/recipes/${recipeId}/reviews`, { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        if (!d.error) {
          setData(d);
          if (d.mine) {
            setRating(d.mine.rating);
            setComment(d.mine.comment || "");
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function verifyPhone() {
    const trimmed = phoneInput.trim();
    if (!trimmed) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: trimmed }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to verify");
      
      // Success! Cookie is set by the server response
      setHasPhone(true);
      setPhoneInput("");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Error");
    } finally {
      setVerifying(false);
    }
  }

  async function submit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      
      // reload data
      const updated = await fetch(`/api/recipes/${recipeId}/reviews`, { cache: "no-store" }).then(r => r.json());
      setData(updated);
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;
  if (!data) return null;

  return (
    <section className="detail-section" style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
      <h2 style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        {isAr ? ar.reviews.title : "Reviews"}
        {data.count > 0 && (
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
            ⭐ {data.average.toFixed(1)} ({data.count} {data.count === 1 ? "review" : "reviews"})
          </span>
        )}
      </h2>

      {hasPhone ? (
        <div style={{ background: "var(--surface)", padding: 20, borderRadius: "var(--radius)", border: "1px solid var(--line)", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            {data.mine ? (isAr ? "تعديل تقييمك" : "Edit your review") : (isAr ? ar.reviews.rateThis : "How was this dish?")}
          </div>
          
          <div style={{ display: "flex", gap: 8, fontSize: 28, cursor: "pointer", marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                style={{
                  color: star <= (hover || rating) ? "#ffd700" : "var(--line-strong)",
                  transition: "transform 0.1s",
                  transform: star <= (hover || rating) ? "scale(1.1)" : "scale(1)",
                }}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isAr ? ar.reviews.placeholder : "Add a note (e.g. 'Needed more salt, loved the crunch!')"}
            style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13, marginBottom: 12, resize: "vertical" }}
          />

          {error && <p style={{ color: "var(--accent)", fontSize: 12, marginBottom: 12 }}>{error}</p>}

          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (isAr ? ar.reviews.submitting : "Saving...") : data.mine ? (isAr ? ar.reviews.update : "Update Review") : (isAr ? ar.reviews.submit : "Submit Review")}
          </button>
        </div>
      ) : (
        <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: "var(--radius)", border: "1px solid var(--line)", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 12 }}>
            🔒 {isAr ? ar.reviews.verify : "Verify your phone to leave a review."}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder={isAr ? "رقم هاتفك" : "Your phone number"}
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") verifyPhone(); }}
              style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={verifyPhone}
              disabled={verifying || !phoneInput.trim()}
            >
              {verifying ? "…" : isAr ? "تحقق" : "Verify"}
            </button>
          </div>
          {verifyError && (
            <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, marginBottom: 0 }}>{verifyError}</p>
          )}
        </div>
      )}

      {data.reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.reviews.map((r, i) => (
            <div key={`${r.id}-${r.updatedAt}-${Math.random()}`} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--muted)", flexShrink: 0 }}>
                {(r.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name || (isAr ? ar.reviews.unnamed : "Family Member")}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(r.updatedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ color: "#ffd700", fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </div>
                {r.comment && <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.reviews.length === 0 && !hasPhone && (
         <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>{isAr ? ar.reviews.noReviews : "No reviews yet. Be the first!"}</p>
      )}
    </section>
  );
}
