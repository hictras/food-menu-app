"use client";

import { useEffect, useState } from "react";
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
};

export default function InboxPage() {
  const { lang } = useLang();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const [showVerify, setShowVerify] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [hasPhone, setHasPhone] = useState(false);

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
        // Heuristic: if any row is targeted (not "all"), we must have a phone cookie
        const anyTargeted = list.some((n) => n.targetPhone && n.targetPhone !== "all");
        setHasPhone(anyTargeted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function verifyPhone() {
    const trimmed = phoneInput.trim();
    if (!trimmed) return;
    setVerifying(true);
    setVerifyMsg("");
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyMsg(data.error || "Failed");
        setVerifying(false);
        return;
      }
      setVerifyMsg(lang === "ar" ? "تم التحقق ✓" : "Verified ✓");
      setShowVerify(false);
      setPhoneInput("");
      setTimeout(() => {
        setVerifyMsg("");
        loadMessages();
      }, 600);
    } catch (err) {
      setVerifyMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setVerifying(false);
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

      {!isAdmin && (
        <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {showVerify ? (
            <>
              <input
                type="text"
                placeholder={lang === "ar" ? "رقم هاتفك" : "Your phone number"}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") verifyPhone(); }}
                style={{ padding: "7px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", fontSize: 13, minWidth: 200 }}
                autoFocus
              />
              <button type="button" className="btn btn-primary" onClick={verifyPhone} disabled={verifying} style={{ fontSize: 12 }}>
                {verifying ? "…" : lang === "ar" ? "تحقق" : "Verify"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowVerify(false); setPhoneInput(""); setVerifyMsg(""); }} style={{ fontSize: 12 }}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setShowVerify(true)} style={{ fontSize: 12 }}>
              {hasPhone
                ? lang === "ar" ? "تغيير رقمي" : "Change my phone"
                : lang === "ar" ? "تحقق من رقم هاتفك" : "Verify your phone"}
            </button>
          )}
          {verifyMsg && (
            <span style={{ fontSize: 12, color: verifyMsg.includes("✓") ? "var(--olive)" : "var(--accent)" }}>
              {verifyMsg}
            </span>
          )}
        </div>
      )}

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

            return (
              <div
                key={item.id}
                onClick={clickable ? () => setOpenId(isOpen ? null : item.id) : undefined}
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
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{item.title}</h3>
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

                {item.url && item.previewImage ? (
                  <Link
                    href={item.url}
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, textDecoration: "none", color: "inherit", marginTop: 4 }}
                  >
                    <img src={item.previewImage} alt="Preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {item.previewTitle ? renderPreviewTitle(item.previewTitle) : <strong>View Recipe</strong>}
                      <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{item.url.replace("https://", "")}</span>
                    </div>
                  </Link>
                ) : (
                  item.url && item.url !== "/inbox" && (
                    <Link
                      href={item.url}
                      onClick={(e) => e.stopPropagation()}
                      className="btn btn-ghost"
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                    >
                      {lang === "ar" ? "عرض الصفحة" : "View Page"} →
                    </Link>
                  )
                )}

                {isAdmin && isOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: 4,
                      padding: 12,
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                        {lang === "ar" ? "العنوان" : "Title"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink)" }}>{item.title}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                        {lang === "ar" ? "النص" : "Body"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink)" }}>{item.body}</div>
                    </div>

                    {item.url && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                          {lang === "ar" ? "الرابط" : "Recipe / URL"}
                        </div>
                        <Link href={item.url} style={{ fontSize: 12, color: "var(--accent)", wordBreak: "break-all" }}>
                          {item.url}
                        </Link>
                      </div>
                    )}

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
                            <span
                              key={p}
                              style={{
                                fontSize: 12,
                                color: "var(--accent)",
                                background: "var(--accent-soft)",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                      {lang === "ar" ? "أُرسلت" : "Sent"} {new Date(item.createdAt).toLocaleString()}
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
