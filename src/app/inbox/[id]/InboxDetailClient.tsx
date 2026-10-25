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
  location: string | null;
  pollId: number | null;
  pollQuestion: string | null;
  pollUrl: string | null;
  url: string | null;
};

export default function InboxDetailClient({ id }: { id: string }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  
  

  const [item, setItem] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        const found = Array.isArray(data) ? data.find((n: Notification) => n.id === Number(id)) : null;
        setItem(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Mark as read
    fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: 40 }}>{ar.calendar.loading}</div>;
  }

  if (!item) {
    return <div className="container" style={{ padding: 40 }}>{isAr ? ar.inboxDetail.messageNotFound : "Message not found"}</div>;
  }

  const hasRecipe = item.url && item.url !== "/inbox" && !item.url.startsWith("/poll/");

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 700 }}>
      <Link href="/inbox" className="btn btn-ghost" style={{ fontSize: "0.75rem", marginBottom: 24 }}>
        {isAr ? ar.inboxDetail.back : "← Back to Inbox"}
      </Link>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: 32 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", margin: "0 0 8px 0", fontWeight: 400 }}>
          {item.title}
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 24px 0" }}>
          {new Date(item.createdAt).toLocaleString()}
        </p>

        {item.location && (
          <div style={{ padding: "10px 16px", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, marginBottom: 24 }}>
            📍 {item.location}
          </div>
        )}

        <p style={{ fontSize: "0.94rem", lineHeight: 1.7, color: "var(--ink)", margin: "0 0 32px 0", whiteSpace: "pre-wrap" }}>
          {item.body}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {item.pollId && (
            <Link href={item.pollUrl || `/poll/${item.pollId}`} className="btn btn-primary" style={{ padding: "12px 20px" }}>
              📊 {isAr ? ar.inboxDetail.openPoll : "Open Poll"}
            </Link>
          )}
          {hasRecipe && (
            <Link href={item.url!} className="btn btn-ghost" style={{ padding: "12px 20px" }}>
              🍽 {isAr ? ar.inboxDetail.viewRecipe : "View Recipe"}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
