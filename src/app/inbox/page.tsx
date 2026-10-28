"use client";

import Spinner from "@/components/Spinner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";
import { useModal } from "@/components/ModalProvider";

type Notification = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  location: string | null;
  time: string | null;
};

export default function InboxPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { show, confirm } = useModal();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  async function loadData() {
    setLoading(true);
    
    // 1. CLEAR APP BADGE (Set notification dot to 0)
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch((error) => console.error('Badge clear error:', error));
    }
    if ('caches' in window) {
      caches.open('badge-count').then((cache) => {
        cache.delete('count');
      });
    }
    // Save last read time
    localStorage.setItem("last_read_inbox", new Date().toISOString());

    // 2. FETCH DATA
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    
    const ok = await confirm({
      message: isAr ? ar.messages.deleteMessageConfirm : "Delete message?",
      confirmText: isAr ? ar.modal.deleteBtn : "Delete",
      tone: "danger"
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        show({ message: isAr ? ar.messages.deleteFailed.ar : "Delete failed", tone: "danger" });
      }
    } catch (err) {
      show({ message: isAr ? ar.messages.deleteFailed.ar : "Delete failed", tone: "danger" });
    }
  }

  function toggleSelection(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleAll() {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map(i => i.id));
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      message: isAr ? "حذف الرسائل المحددة؟" : "Delete selected messages?",
      confirmText: isAr ? ar.modal.deleteBtn : "Delete",
      tone: "danger"
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/notifications/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
      } else {
        show({ message: isAr ? "فشل الحذف" : "Delete failed", tone: "danger" });
      }
    } catch {
      show({ message: isAr ? "فشل الحذف" : "Delete failed", tone: "danger" });
    }
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 700 }}>
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{isAr ? ar.inbox.title : "Inbox"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && items.length > 0 && (
            <>
              <button onClick={toggleAll} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>
                {selectedIds.length === items.length ? (isAr ? "إلغاء تحديد الكل" : "Deselect All") : (isAr ? "تحديد الكل" : "Select All")}
              </button>
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="btn btn-danger" style={{ fontSize: "0.8rem" }}>
                  🗑 {isAr ? "حذف المحدد" : "Delete Selected"} ({selectedIds.length})
                </button>
              )}
            </>
          )}
          <button onClick={loadData} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>
            ↻ {isAr ? ar.inboxDetail.refresh : ar.inboxDetail.refreshEn}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>{isAr ? ar.inbox.empty : "No notifications yet"}</h2>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid var(--line)",
                background: selectedIds.includes(item.id) ? "var(--accent-soft)" : (item.isRead ? "transparent" : "rgba(255, 255, 255, 0.02)"),
                transition: "background 0.15s",
              }}
            >
              {isAdmin && (
                <div style={{ padding: "0 0 0 16px", display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }}
                  />
                </div>
              )}
              <Link
                href={`/inbox/${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  textDecoration: "none",
                  flex: 1,
                  minWidth: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.parentElement!.style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.parentElement!.style.background = item.isRead ? "transparent" : "rgba(255, 255, 255, 0.02)"; }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "0.94rem", fontWeight: item.isRead ? 400 : 700, color: item.isRead ? "var(--ink-soft)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </span>
                  {item.location && (
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>📍 {item.location}</span>
                  )}
                  {item.time && (
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>⏰ {item.time}</span>
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

              {isAdmin && (
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent)",
                    padding: "16px 20px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                  }}
                  title={isAr ? ar.modal.deleteBtn : "Delete"}
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
