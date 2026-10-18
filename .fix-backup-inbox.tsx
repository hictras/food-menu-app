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
  createdAt: string;
};

export default function InboxPage() {
  const { lang } = useLang();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [colors, setColors] = useState({
    inbox_title_color_light: "#e2543a",
    inbox_title_color_dark: "#ff6b4a",
    inbox_recipe_color_light: "#52525b",
    inbox_recipe_color_dark: "#a1a1aa",
  });

  useEffect(() => {
    fetch("/api/auth/me").then((res) => res.json()).then((data) => setIsAdmin(!!data.admin)).catch(() => setIsAdmin(false));
    fetch("/api/settings").then(res => res.json()).then(data => {
      if (data.inbox_title_color_light) setColors(prev => ({ ...prev, ...data }));
    });
    loadMessages();
  }, []);

  function loadMessages() {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleDelete(id: number) {
    const confirmDelete = window.confirm(lang === "ar" ? "حذف الرسالة؟" : "Delete message?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  }

  function renderPreviewTitle(title: string) {
    // Check if title contains the hyphen split (e.g., "Hicham's... - Musakhan")
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
      <p className="page-sub">{lang === "ar" ? "كل التحديثات السابقة" : "All previous updates"}</p>

      {loading ? (
        <p className="helper">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <h2>{lang === "ar" ? "لا توجد إشعارات" : "No notifications yet"}</h2>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{item.title}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  {isAdmin && (
                    <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 14 }}>🗑</button>
                  )}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>{item.body}</p>

              {/* Show Image Preview Card (if it exists) */}
              {item.url && item.previewImage ? (
                <Link href={item.url} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, textDecoration: "none", color: "inherit", marginTop: 4 }}>
                  <img src={item.previewImage} alt="Preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {item.previewTitle ? renderPreviewTitle(item.previewTitle) : <strong>View Recipe</strong>}
                    <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{item.url.replace("https://", "")}</span>
                  </div>
                </Link>
              ) : (
                /* Only show the button if there is NO image preview */
                item.url && item.url !== "/inbox" && (
                  <Link href={item.url} className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                    {lang === "ar" ? "عرض الصفحة" : "View Page"} →
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
