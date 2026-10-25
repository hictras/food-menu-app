"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type Notification = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  location: string | null;
};

export default function InboxPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
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

  if (loading) {
    return <div className="container" style={{ padding: 40 }}>{ar.calendar.loading}</div>;
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 700 }}>
      <div className="page-head">
        <h1>{isAr ? ar.inbox.title : "Inbox"}</h1>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>{isAr ? ar.inbox.empty : "No notifications yet"}</h2>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/inbox/${item.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--line)",
                textDecoration: "none",
                background: item.isRead ? "transparent" : "rgba(255, 255, 255, 0.02)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = item.isRead ? "transparent" : "rgba(255, 255, 255, 0.02)"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.94rem", fontWeight: item.isRead ? 400 : 700, color: item.isRead ? "var(--ink-soft)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </span>
                {item.location && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>📍 {item.location}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                {!item.isRead && (
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
