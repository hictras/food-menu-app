"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type PollData = {
  id: number;
  question: string;
  isOpen: boolean;
  title: string;
  body: string;
  targetPhone: string | null;
  yesCount: number;
  noCount: number;
  myAnswer: "yes" | "no" | null;
  canVote: boolean;
  hasPhoneCookie: boolean;
  isTargetedToMe: boolean;
};

export default function PollPage() {
  const { lang } = useLang();
  const router = useRouter();
  const params = useParams();
  const pollId = params?.id as string;

  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const [phoneInput, setPhoneInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const load = useCallback(() => {
    if (!pollId) return;
    setLoading(true);
    fetch(`/api/polls/${pollId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setPoll(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load");
        setLoading(false);
      });
  }, [pollId]);

  useEffect(() => {
    load();
  }, [load]);

  async function verify() {
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
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Failed to verify");
        setVerifying(false);
        return;
      }
      setPhoneInput("");
      load();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Error");
    } finally {
      setVerifying(false);
    }
  }

  async function vote(answer: "yes" | "no") {
    setVoting(true);
    setError("");
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to vote");
        setVoting(false);
        return;
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: 40 }}>
        <p className="helper">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </main>
    );
  }

  if (error && !poll) {
    return (
      <main className="container" style={{ paddingTop: 40 }}>
        <div className="empty">
          <h2>{lang === "ar" ? "خطأ" : "Error"}</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!poll) return null;

  const total = poll.yesCount + poll.noCount;
  const yesPct = total > 0 ? Math.round((poll.yesCount / total) * 100) : 0;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 640 }}>
      <div className="page-head">
        <h1 style={{ fontSize: 28, margin: 0 }}>
          {lang === "ar" ? "استطلاع" : "Poll"}
        </h1>
      </div>

      <div className="form-card" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          {lang === "ar" ? "السؤال" : "Question"}
        </div>
        <h2 style={{ fontSize: 24, margin: "0 0 20px 0", fontFamily: "var(--font-head)", fontWeight: 400 }}>
          {poll.question}
        </h2>

        {poll.body && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20, lineHeight: 1.55 }}>
            {poll.body}
          </p>
        )}

        {/* Tally */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 13, color: "var(--ink-soft)" }}>
            <span>
              <strong style={{ color: "var(--olive)", fontSize: 16 }}>{poll.yesCount}</strong>{" "}
              {lang === "ar" ? "نعم" : "Yes"}
            </span>
            <span>
              <strong style={{ color: "var(--accent)", fontSize: 16 }}>{poll.noCount}</strong>{" "}
              {lang === "ar" ? "لا" : "No"}
            </span>
            <span style={{ marginInlineStart: "auto", color: "var(--muted)" }}>
              {total} {lang === "ar" ? "صوت" : total === 1 ? "vote" : "votes"}
            </span>
          </div>
          {total > 0 && (
            <div style={{ height: 8, borderRadius: 4, background: "var(--line)", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${yesPct}%`, background: "var(--olive)", transition: "width 0.3s ease" }} />
              <div style={{ width: `${100 - yesPct}%`, background: "var(--accent)", transition: "width 0.3s ease" }} />
            </div>
          )}
        </div>

        {/* Not open */}
        {!poll.isOpen && (
          <div style={{ padding: "10px 14px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            {lang === "ar" ? "التصويت مغلق" : "Voting is closed"}
          </div>
        )}

        {/* No phone cookie → inline verify */}
        {poll.isOpen && !poll.hasPhoneCookie && (
          <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
              {lang === "ar" ? "تحقق من رقم هاتفك للتصويت" : "Verify your phone to vote"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder={lang === "ar" ? "رقم هاتفك" : "Your phone number"}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
                style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={verify}
                disabled={verifying || !phoneInput.trim()}
              >
                {verifying ? "…" : lang === "ar" ? "تحقق" : "Verify"}
              </button>
            </div>
            {verifyError && (
              <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, marginBottom: 0 }}>{verifyError}</p>
            )}
          </div>
        )}

        {/* Has cookie but not invited */}
        {poll.isOpen && poll.hasPhoneCookie && !poll.isTargetedToMe && (
          <div style={{ padding: "10px 14px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            {lang === "ar" ? "أنت غير مدعو لهذا الاستطلاع" : "You are not invited to this poll"}
          </div>
        )}

        {/* Vote buttons */}
        {poll.isOpen && poll.canVote && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => vote("yes")}
              disabled={voting}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 10,
                border: poll.myAnswer === "yes" ? "2px solid var(--olive)" : "1px solid var(--line)",
                background: poll.myAnswer === "yes" ? "var(--olive-soft)" : "var(--surface)",
                color: poll.myAnswer === "yes" ? "var(--olive)" : "var(--ink)",
                fontSize: 15,
                fontWeight: 600,
                cursor: voting ? "not-allowed" : "pointer",
                opacity: voting ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {poll.myAnswer === "yes" ? "✓ " : ""}
              {lang === "ar" ? "نعم" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => vote("no")}
              disabled={voting}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 10,
                border: poll.myAnswer === "no" ? "2px solid var(--accent)" : "1px solid var(--line)",
                background: poll.myAnswer === "no" ? "var(--accent-soft)" : "var(--surface)",
                color: poll.myAnswer === "no" ? "var(--accent)" : "var(--ink)",
                fontSize: 15,
                fontWeight: 600,
                cursor: voting ? "not-allowed" : "pointer",
                opacity: voting ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {poll.myAnswer === "no" ? "✓ " : ""}
              {lang === "ar" ? "لا" : "No"}
            </button>
          </div>
        )}

        {poll.myAnswer && poll.isOpen && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, marginBottom: 0, textAlign: "center" }}>
            {lang === "ar" ? "يمكنك تغيير صوتك بالضغط على الزر الآخر" : "You can change your vote anytime"}
          </p>
        )}

        {error && poll && (
          <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 12 }}>{error}</p>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push("/inbox")}
            style={{ fontSize: 12 }}
          >
            {lang === "ar" ? "→ العودة إلى صندوق الرسائل" : "→ Back to inbox"}
          </button>
        </div>
      </div>
    </main>
  );
}
