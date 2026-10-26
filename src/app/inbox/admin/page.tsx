"use client";

import Spinner from "@/components/Spinner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type ReadEntry = { name: string | null; phone: string };

type AdminNotification = {
  id: number;
  title: string;
  createdAt: string;
  readers: ReadEntry[];
};

export default function InboxAdminPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else load();
      });
  }, [router]);

  function load() {
    fetch("/api/inbox/admin")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <Link href="/inbox" className="btn btn-ghost" style={{ fontSize: "0.75rem", marginBottom: 24 }}>
        {isAr ? ar.inboxDetail.back : "← Back to Inbox"}
      </Link>

      <div className="page-head">
        <h1>{isAr ? ar.inboxDetail.adminTitle : "Inbox Admin"}</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>{item.title}</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>

            <div style={{ fontSize: "0.81rem", fontWeight: 600, color: "var(--olive)", marginBottom: 6 }}>
              {isAr ? ar.inboxDetail.readBy : "Read by"} · {item.readers.length}
            </div>
            {item.readers.length === 0 ? (
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                {isAr ? ar.inboxDetail.noReads : "No one has read this message yet."}
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {item.readers.map((r, index) => (
                  <span key={`${r.phone}-${index}`} style={{ fontSize: "0.75rem", padding: "4px 10px", background: "var(--olive-soft)", color: "var(--olive)", borderRadius: 999, fontWeight: 500 }}>
                    {r.name || (isAr ? ar.inbox.unnamed : "Unnamed")} ({r.phone})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
