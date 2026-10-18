"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type Notification = {
  id: number;
  title: string;
  body: string;
  url: string | null;
  createdAt: string;
};

export default function InboxPage() {
  const { lang } = useLang();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "صندوق الإشعارات" : "Inbox"}</h1>
      </div>
      <p className="page-sub">
        {lang === "ar" ? "كل التحديثات السابقة" : "All previous updates"}
      </p>

      {loading ? (
        <p className="helper">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <h2>{lang === "ar" ? "لا توجد إشعارات" : "No notifications yet"}</h2>
          <p>{lang === "ar" ? "عندما نرسل تحديثاً، سيظهر هنا." : "When we send an update, it will appear here."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                  {item.title}
                </h3>
                <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {new Date(item.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                {item.body}
              </p>
              {item.url && item.url !== "/inbox" && (
                <Link
                  href={item.url}
                  className="btn btn-ghost"
                  style={{ alignSelf: "flex-start", marginTop: 4 }}
                >
                  {lang === "ar" ? "عرض" : "View"} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
