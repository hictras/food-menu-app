"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type Notification = {
  id: number;
  title: string;
  body: string;
  url: string | null;
  previewImage: string | null;
  previewTitle: string | null;
  targetPhone: string | null;
  createdAt: string;
  pollId: number | null;
  pollQuestion: string | null;
  pollIsOpen: number | null;
  pollUrl: string | null;
};

type PollResponses = {
  pollId: number;
  question: string;
  isOpen: boolean;
  yes: { phone: string; name: string | null; respondedAt: string }[];
  no: { phone: string; name: string | null; respondedAt: string }[];
  pending: { phone: string; name: string | null }[];
  counts: { yes: number; no: number; pending: number; total: number };
};

const ORIGINS_TO_STRIP = [
  "https://food-menu-app-xxww.onrender.com",
  "https://food-menu-app-xet2.onrender.com",
  "http://localhost:3000",
];

function relativeUrl(url: string | null): string | null {
  if (!url) return null;
  for (const origin of ORIGINS_TO_STRIP) {
    if (url.startsWith(origin)) {
      const stripped = url.slice(origin.length);
      return stripped.startsWith("/") ? stripped : `/${stripped}`;
    }
  }
  return url;
}

export default function InboxPage() {
  const { lang } = useLang();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [hasPhone, setHasPhone] = useState(false);

  const [responsesByPollId, setResponsesByPollId] = useState<Record<number, PollResponses>>({});
  const [loadingResponses, setLoadingResponses] = useState<number | null>(null);

  const [colors, setColors] = useState({
    inbox_title_color_light: "#e2543a",
    inbox_title_color_dark: "#ff6b4a",
    inbox_recipe_color_light: "#52525b",
    inbox_recipe_color_dark: "#a1a1aa",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false));

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.inbox_title_color_light) setColors((prev) => ({ ...prev, ...data }));
      });

    loadMessages();
  }, []);

  function loadMessages() {
    setLoading(true);
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        const anyTargeted = list.some((n) => n.targetPhone && n.targetPhone !== "all");
        setHasPhone(anyTargeted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const loadResponses = useCallback((pollId: number) => {
    if (responsesByPollId[pollId]) return;
    setLoadingResponses(pollId);
    fetch(`/api/polls/${pollId}/responses`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setResponsesByPollId((prev) => ({ ...prev, [pollId]: data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingResponses(null));
  }, [responsesByPollId]);

  function toggleOpen(item: Notification) {
    if (!isAdmin) return;
    const willOpen = openId !== item.id;
    setOpenId(willOpen ? item.id : null);
    if (willOpen && item.pollId) {
      loadResponses(item.pollId);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const confirmDelete = window.confirm(lang === "ar" ? "حذف الرسالة؟" : "Delete message?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Delete failed");
    }
  }

  async function togglePollOpen(pollId: number, e: React.MouseEvent) {
    e.stopPropagation();
    const current = responsesByPollId[pollId];
    const newState = current ? !current.isOpen : false;
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: newState }),
      });
      if (!res.ok) throw new Error("Failed");
      setResponsesByPollId((prev) => ({
        ...prev,
        [pollId]: { ...prev[pollId], isOpen: newState },
      }));
    } catch {
      alert("Failed to update poll");
    }
  }

  function recipientBadge(target: string | null): { label: string; color: string; bg: string } {
    if (!target || target === "all") {
      return { label: lang === "ar" ? "الجميع" : "All", color: "var(--muted)", bg: "var(--surface-2)" };
    }
    const parts = target.split(",").map((s) => s.trim()).filter(Boolean);
    return { label: String(parts.length), color: "var(--accent)", bg: "var(--accent-soft)" };
  }

  function recipientList(target: string | null): string[] {
    if (!target || target === "all") return [];
    return target.split(",").map((s) => s.trim()).filter(Boolean);
  }

  function renderPreviewTitle(title: string) {
    if (title.includes(" - ")) {
      const [mainTitle, recipeName] = title.split(" - ");
      return (
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            className="custom-color-text"
            style={{ "--custom-light": colors.inbox_title_color_light, "--custom-dark": colors.inbox_title_color_dark, fontWeight: 700 } as React.CSSProperties}
          >
            {mainTitle}
          </span>
          <span
            className="custom-color-text"
            style={{ "--custom-light": colors.inbox_recipe_color_light, "--custom-dark": colors.inbox_recipe_color_dark, fontWeight: 500, fontSize: 12 } as React.CSSProperties}
          >
            {recipeName}
          </span>
        </span>
      );
    }
    return <strong style={{ fontSize: 13, color: "var(--ink)" }}>{title}</strong>;
  }

  function renderPollTally(item: Notification) {
    if (!item.pollId) return null;
    const r = responsesByPollId[item.pollId];
    const yes = r?.counts.yes ?? 0;
    const no = r?.counts.no ?? 0;
    const pending = r?.counts.pending ?? 0;
    const total = yes + no + pending;
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: 12 }}>
          <strong style={{ color: "var(--olive)", fontSize: 14 }}>{yes}</strong>{" "}
          <span style={{ color: "var(--ink-soft)" }}>{lang === "ar" ? "نعم" : "Yes"}</span>
        </span>
        <span style={{ fontSize: 12 }}>
          <strong style={{ color: "var(--accent)", fontSize: 14 }}>{no}</strong>{" "}
          <span style={{ color: "var(--ink-soft)" }}>{lang === "ar" ? "لا" : "No"}</span>
        </span>
        <span style={{ fontSize: 12 }}>
          <strong style={{ color: "var(--muted)", fontSize: 14 }}>{pending}</strong>{" "}
          <span style={{ color: "var(--ink-soft)" }}>{lang === "ar" ? "معلق" : "Pending"}</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--muted)", marginInlineStart: "auto" }}>
          {total} {lang === "ar" ? "مدعو" : total === 1 ? "invitee" : "invitees"}
        </span>
      </div>
    );
  }

  function renderPollDetail(item: Notification) {
    if (!item.pollId) return null;
    const r = responsesByPollId[item.pollId];
    const isLoading = loadingResponses === item.pollId;

    if (isLoading || !r) {
      return (
        <div style={{ padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, color: "var(--muted)" }}>
          {lang === "ar" ? "جاري تحميل الأصوات..." : "Loading responses..."}
        </div>
      );
    }

    const renderGroup = (title: string, color: string, bg: string, people: { phone: string; name: string | null }[]) => (
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color, marginBottom: 6 }}>
          {title} · {people.length}
        </div>
        {people.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 10 }}>
            {lang === "ar" ? "لا أحد" : "None"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {people.map((p) => (
              <div key={p.phone} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: bg, border: "1px solid var(--line)", borderRadius: 6, fontSize: 12 }}>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                  {p.name || (lang === "ar" ? "بدون اسم" : "Unnamed")}
                </span>
                <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{p.phone}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    return (
      <div style={{ padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            📊 {lang === "ar" ? "نتائج الاستطلاع" : "Poll results"}
          </div>
          <button
            type="button"
            onClick={(e) => togglePollOpen(item.pollId!, e)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: r.isOpen ? "var(--surface-2)" : "var(--accent-soft)",
              color: r.isOpen ? "var(--ink-soft)" : "var(--accent)",
              cursor: "pointer",
            }}
          >
            {r.isOpen
              ? (lang === "ar" ? "إغلاق التصويت" : "Close voting")
              : (lang === "ar" ? "إعادة فتح التصويت" : "Reopen voting")}
          </button>
        </div>

        {renderGroup(lang === "ar" ? "نعم" : "Yes", "var(--olive)", "var(--olive-soft)", r.yes)}
        {renderGroup(lang === "ar" ? "لا" : "No", "var(--accent)", "var(--accent-soft)", r.no)}
        {renderGroup(lang === "ar" ? "لم يصوت" : "Pending", "var(--muted)", "var(--surface-2)", r.pending)}

        {item.pollQuestion && (
          <div style={{ fontSize: 11, color: "var(--muted)", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
            {item.pollQuestion}
          </div>
        )}
      </div>
    );
  }

  function hasRecipeLink(item: Notification): boolean {
    const rel = relativeUrl(item.url);
    if (!rel) return false;
    if (rel === "/inbox") return false;
    if (rel.startsWith("/poll/")) return false;
    if (item.pollUrl && rel === item.pollUrl) return false;
    return true;
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "صندوق الإشعارات" : "Inbox"}</h1>
      </div>
      <p className="page-sub">
        {isAdmin
          ? lang === "ar" ? "أنت ترى كل الرسائل كمسؤول" : "Admin view — you see every message"
          : hasPhone
            ? lang === "ar" ? "رسائلك الخاصة" : "Your messages"
            : lang === "ar" ? "ترى فقط الرسائل العامة" : "You are seeing broadcast messages only"}
      </p>

      {loading ? (
        <p className="helper">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <h2>{lang === "ar" ? "لا توجد إشعارات" : "No notifications yet"}</h2>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {items.map((item) => {
            const badge = recipientBadge(item.targetPhone);
            const phones = recipientList(item.targetPhone);
            const isOpen = isAdmin && openId === item.id;
            const clickable = isAdmin;
            const hasPoll = !!item.pollId;
            const showRecipe = hasRecipeLink(item);
            const relUrl = relativeUrl(item.url);
            const relPollUrl = relativeUrl(item.pollUrl) || (item.pollId ? `/poll/${item.pollId}` : null);

            return (
              <div
                key={item.id}
                onClick={clickable ? () => toggleOpen(item) : undefined}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  cursor: clickable ? "pointer" : "default",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={clickable ? (e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; } : undefined}
                onMouseLeave={clickable ? (e) => { e.currentTarget.style.borderColor = "var(--line)"; } : undefined}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {hasPoll && (
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
                    )}
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{item.title}</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {isAdmin && (
                      <span
                        title={item.targetPhone === "all" ? "All subscribers" : item.targetPhone || ""}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: badge.color,
                          background: badge.bg,
                          padding: "2px 9px",
                          borderRadius: 999,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {badge.label}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 14 }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>{item.body}</p>

                {hasPoll && isAdmin && renderPollTally(item)}

                {item.previewImage && relUrl && (
                  <Link
                    href={relUrl}
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, textDecoration: "none", color: "inherit", marginTop: 4 }}
                  >
                    <img src={item.previewImage} alt="Preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {item.previewTitle ? renderPreviewTitle(item.previewTitle) : <strong>View Recipe</strong>}
                      <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{relUrl.replace(/^https?:\/\//, "")}</span>
                    </div>
                  </Link>
                )}

                {showRecipe && !item.previewImage && relUrl && (
                  <Link
                    href={relUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-ghost"
                    style={{ alignSelf: "flex-start", marginTop: 4 }}
                  >
                    {lang === "ar" ? "عرض الصفحة" : "View Page"} →
                  </Link>
                )}

                {hasPoll && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={relPollUrl || `/poll/${item.pollId}`}
                      className="btn btn-primary"
                      style={{ fontSize: 12 }}
                    >
                      📊 {lang === "ar" ? "فتح الاستطلاع" : "Open poll"} →
                    </Link>
                    {showRecipe && relUrl && (
                      <Link
                        href={relUrl}
                        className="btn btn-ghost"
                        style={{ fontSize: 12 }}
                      >
                        🍽 {lang === "ar" ? "عرض الوصفة" : "View recipe"} →
                      </Link>
                    )}
                  </div>
                )}

                {isAdmin && isOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    {hasPoll && renderPollDetail(item)}

                    <div style={{ padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                          {lang === "ar" ? "الرسالة" : "Message"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink)" }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{item.body}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                          {lang === "ar" ? "المستلمون" : "Recipients"}
                        </div>
                        {phones.length === 0 ? (
                          <div style={{ fontSize: 13, color: "var(--ink)" }}>
                            {lang === "ar" ? "الجميع" : "All subscribers"}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {phones.map((p) => (
                              <span key={p} style={{ fontSize: 12, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: 10, color: "var(--muted)" }}>
                        {lang === "ar" ? "أُرسلت" : "Sent"} {new Date(item.createdAt).toLocaleString()}
                      </div>
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
