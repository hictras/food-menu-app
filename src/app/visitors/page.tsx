"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";
import { useModal } from "@/components/ModalProvider";

type Visitor = { id: string; phone: string | null; name: string | null; visits: number; lastSeen: string; lastPage: string | null };

export default function VisitorsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const { show, confirm } = useModal();
  
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else loadVisitors();
      });
  }, [router]);

  function loadVisitors() {
    setLoading(true);
    fetch("/api/visitors", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setVisitors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleSave(id: string) {
    if (!editPhone.trim()) {
      show({ message: isAr ? ar.visitorsPage.phoneRequired : "Phone number is required", tone: "danger" });
      return;
    }

    try {
      const res = await fetch("/api/visitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, phone: editPhone.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        show({ message: isAr ? ar.visitorsPage.updateFailed : (data.error || "Failed to update"), tone: "danger" });
        return;
      }
      
      setEditId(null);
      loadVisitors();
    } catch {
      show({ message: isAr ? ar.visitorsPage.updateFailed : "Error updating visitor", tone: "danger" });
    }
  }

  async function deleteVisitor(id: string) {
    const ok = await confirm({ 
      message: isAr ? ar.messages.deleteLogConfirm : "Delete this log?",
      confirmText: isAr ? ar.modal.deleteBtn : "Delete",
      tone: "danger"
    });
    if (!ok) return;
    
    await fetch("/api/visitors?id=" + id, { method: "DELETE" });
    loadVisitors();
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.visitorsPage.loading : "Loading..."}</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 900 }}>
      <div className="page-head">
        <h1>{isAr ? ar.visitorsPage.title : "Devices Log"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? ar.visitorsPage.subtitle : "List of all devices that opened the app"}
      </p>

      <div className="form-card" style={{ padding: 0, overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {visitors.length} {isAr ? ar.visitorsPage.totalDevices : "Devices"}
          </span>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={loadVisitors}>
            ↻ {isAr ? ar.visitorsPage.refresh : "Refresh"}
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 700 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>#</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.visitorsPage.name : "Name"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.visitorsPage.phone : "Phone"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>{isAr ? "الزيارات" : "Visits"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? "آخر صفحة" : "Last Page"}</th>
              <th style={{ padding: 12, textAlign: "end", fontWeight: 600 }}>{isAr ? ar.visitorsPage.lastSeen : "Last Seen"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                  {isAr ? ar.visitorsPage.noDevices : "No devices registered yet."}
                </td>
              </tr>
            ) : (
              visitors.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                  
                  {editId === v.id ? (
                    <>
                      <td style={{ padding: 8, color: "var(--muted)", fontStyle: "italic" }}>{isAr ? ar.visitorsPage.linkPhone : "Link Phone"}</td>
                      <td style={{ padding: 8 }}>
                        <input 
                          type="text" 
                          placeholder={isAr ? ar.visitorsPage.phoneNumberPlaceholder : "Phone number"} 
                          value={editPhone} 
                          onChange={(e) => setEditPhone(e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                          autoFocus
                        />
                      </td>
                      <td style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "var(--accent)" }}>{v.visits || 0}</td>
                      <td style={{ padding: 12, textAlign: "start", color: "var(--muted)" }}>—</td>
                      <td style={{ padding: 12, textAlign: "end", color: "var(--muted)" }}>—</td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <button onClick={() => handleSave(v.id)} className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12, marginRight: 4 }}>
                          {isAr ? ar.visitorsPage.save : "Save"}
                        </button>
                        <button onClick={() => setEditId(null)} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>
                          {isAr ? ar.visitorsPage.cancel : "Cancel"}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: 12, fontWeight: 600, color: v.name ? "var(--ink)" : "var(--muted)" }}>
                        {v.name || (isAr ? ar.visitorsPage.unknown : "Unknown")}
                      </td>
                      <td style={{ padding: 12, color: "var(--ink-soft)", fontFamily: "monospace" }}>
                        {v.phone || "-"}
                      </td>
                      <td style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "var(--accent)" }}>
                        {v.visits || 0}
                      </td>
                      <td style={{ padding: 12, color: "var(--accent)", fontFamily: "monospace", fontSize: 12 }}>
                        {v.lastPage || "-"}
                      </td>
                      <td style={{ padding: 12, textAlign: "end", color: "var(--muted)" }}>
                        {new Date(v.lastSeen).toLocaleString()}
                      </td>
                      <td style={{ padding: 12, textAlign: "center" }}>
                        <button onClick={() => { setEditId(v.id); setEditPhone(v.phone || ""); }} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12, marginRight: 4 }}>
                          {isAr ? ar.visitorsPage.edit : "Edit"}
                        </button>
                        <button onClick={() => deleteVisitor(v.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 16, padding: 4 }}>
                          🗑
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
