"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type Voter = {
  phone: string;
  name: string | null;
  respondedAt: string;
  answer: "yes" | "no";
};

type PendingVoter = {
  phone: string;
  name: string | null;
};

type Reply = {
  pollId: number;
  question: string;
  isOpen: boolean;
  createdAt: string;
  lastVoteAt: string | null;
  targetPhone: string;
  inviteeCount: number;
  counts: { yes: number; no: number; pending: number; total: number };
  voters: Voter[];
  pending: PendingVoter[];
};

export default function RepliesPage() {
  const { lang } = useLang();
  const router = useRouter();

  const [items, setItems] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) {
          router.push("/login");
        } else {
          setIsAdmin(true);
          loadReplies();
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  function loadReplies() {
    setLoading(true);
    fetch("/api/replies")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function fmtTime(iso: string | null): string {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  if (!isAdmin && loading) {
    return (
      <main className="container" style={{ paddingTop: 40 }}>
        <p className="helper">{lang === "ar" ? "جاري التحقق..." : "Checking access..."}</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "الردود" : "Replies"}</h1>
      </div>
      <p className="page-sub">
        {lang === "ar"
          ? "كل الردود على الاستطلاعات — اضغط لعرض من صوت"
          : "All poll responses — click to see who voted"}
      </p>

      {loading ? (
        <p className="helper">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <h2>{lang === "ar" ? "لا ردود بعد" : "No replies yet"}</h2>
          <p>{lang === "ar" ? "أرسل استطلاعاً لبدء جمع الردود." : "Send a poll to start collecting replies."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {items.map((r) => {
            const isOpen = openId === r.pollId;
            return (
              <div
                key={r.pollId}
                onClick={() => setOpenId(isOpen ? null : r.pollId)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: 16,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                        border: "1px solid var(--accent)",
                      }}>
                        📊 {lang === "ar" ? "استطلاع" : "Poll"}
                      </span>
                      {!r.isOpen && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "var(--surface-2)",
                          color: "var(--muted)",
                          border: "1px solid var(--line)",
                        }}>
                          {lang === "ar" ? "مغلق" : "Closed"}
                        </span>
                      )}
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                        {r.question}
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
                      <span>
                        <strong style={{ color: "var(--olive)", fontSize: 15 }}>{r.counts.yes}</strong>{" "}
                        <span style={{ color: "var(--ink-soft)" }}>{lang === "ar" ? "نعم" : "Yes"}</span>
                      </span>
                      <span>
                        <strong style={{ color: "var(--accent)", fontSize: 15 }}>{r.counts.no}</strong>{" "}
                        <span style={{ color: "var(--ink-soft)" }}>{lang === "ar" ? "لا" : "No"}</span>
                      </span>
                      <span>
                        <strong style={{ color: "var(--muted)", fontSize: 15 }}>{r.counts.pending}</strong>{" "}
                        <span style={{ color: "var(--ink-soft)" }}>{lang === "ar" ? "معلق" : "Pending"}</span>
                      </span>
                      <span style={{ marginInlineStart: "auto", fontSize: 11, color: "var(--muted)" }}>
                        {r.counts.total} {lang === "ar" ? "مدعو" : r.counts.total === 1 ? "invitee" : "invitees"}
                      </span>
                    </div>

                    {r.lastVoteAt && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                        {lang === "ar" ? "آخر صوت" : "Last vote"}: {fmtTime(r.lastVoteAt)}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/poll/${r.pollId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, flexShrink: 0 }}
                  >
                    📊 {lang === "ar" ? "فتح" : "Open"}
                  </Link>
                </div>

                {isOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>
                        {lang === "ar" ? "الذين صوتوا" : "Voters"} ({r.voters.length})
                      </div>
                      {r.voters.length === 0 ? (
                        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                          {lang === "ar" ? "لا أحد صوت بعد" : "Nobody has voted yet"}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {r.voters.map((v) => (
                            <div
                              key={v.phone + v.respondedAt}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "6px 10px",
                                background: v.answer === "yes" ? "var(--olive-soft)" : "var(--accent-soft)",
                                border: "1px solid var(--line)",
                                borderRadius: 6,
                                fontSize: 12,
                              }}
                            >
                              <span style={{
                                fontWeight: 700,
                                color: v.answer === "yes" ? "var(--olive)" : "var(--accent)",
                                minWidth: 32,
                              }}>
                                {v.answer === "yes" ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")}
                              </span>
                              <span style={{ flex: 1, color: "var(--ink)", fontWeight: 500 }}>
                                {v.name || (lang === "ar" ? "بدون اسم" : "Unnamed")}
                              </span>
                              <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                                {v.phone}
                              </span>
                              <span style={{ color: "var(--muted)", fontSize: 11, minWidth: 130, textAlign: "end" }}>
                                {fmtTime(v.respondedAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>
                        {lang === "ar" ? "لم يصوتوا" : "Pending"} ({r.pending.length})
                      </div>
                      {r.pending.length === 0 ? (
                        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                          {lang === "ar" ? "صوت الجميع" : "Everyone has voted"}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {r.pending.map((p) => (
                            <span
                              key={p.phone}
                              style={{
                                fontSize: 12,
                                padding: "4px 10px",
                                background: "var(--surface-2)",
                                border: "1px solid var(--line)",
                                borderRadius: 6,
                                color: "var(--ink-soft)",
                              }}
                            >
                              {p.name || (lang === "ar" ? "بدون اسم" : "Unnamed")}
                              <span style={{ color: "var(--muted)", marginInlineStart: 6 }}>{p.phone}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{
                      padding: 14,
                      background: "var(--bg)",
                      border: "1px dashed var(--line-strong)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--muted)",
                      textAlign: "center",
                    }}>
                      💬 {lang === "ar" ? "الدردشة قادمة قريباً" : "Chat coming soon"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
