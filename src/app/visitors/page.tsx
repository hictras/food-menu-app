"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type Visitor = { id: string; phone: string | null; name: string | null; visits: number; lastSeen: string };

export default function VisitorsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else loadVisitors();
      });
  }, [router]);

  
  async function savePhone(id: string) {
    setSavingPhone(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, phone: phoneInput.trim() }),
      });
      const data = await res.json();
      
      setEditingId(null);
      setPhoneInput("");
      loadVisitors(); // Reload the list to show the new name
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingPhone(false);
    }
  }

  function loadVisitors() {
    setLoading(true);
    fetch("/api/visitors")
      .then((r) => r.json())
      .then((data) => {
        setVisitors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.visitorsPage.loading : "Loading..."}</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-head">
        <h1>{isAr ? ar.visitorsPage.title : "Devices Log"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? ar.visitorsPage.subtitle : "List of all devices that opened the app"}
      </p>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {visitors.length} {isAr ? ar.visitorsPage.totalDevices : "Devices"}
          </span>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={loadVisitors}>
            ↻ {isAr ? ar.visitorsPage.refresh : "Refresh"}
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>#</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.visitorsPage.name : "Name"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.visitorsPage.phone : "Phone"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>{isAr ? "الزيارات" : "Visits"}</th>
              <th style={{ padding: 12, textAlign: "end", fontWeight: 600 }}>
                {isAr ? ar.visitorsPage.lastSeen : "Last Seen"}
              </th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                  {isAr ? ar.visitorsPage.noDevices : "No devices registered yet."}
                </td>
              </tr>
            ) : (
              visitors.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                  <td style={{ padding: 12, fontWeight: 600, color: "var(--ink)" }}>
                    {v.name || (isAr ? ar.visitorsPage.unknown : "Unknown")}
                  </td>
                  
                  <td style={{ padding: 12, color: "var(--ink-soft)", fontFamily: "monospace" }}>
                    {v.phone ? (
                      v.phone
                    ) : editingId === v.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input 
                          type="text" 
                          value={phoneInput} 
                          onChange={(e) => setPhoneInput(e.target.value)} 
                          placeholder="961..." 
                          style={{ width: 100, padding: 4, borderRadius: 4, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 12 }}
                        />
                        <button type="button" onClick={() => savePhone(v.id)} disabled={savingPhone} className="btn btn-primary" style={{ padding: "2px 8px", fontSize: 11 }}>
                          {savingPhone ? "..." : "✓"}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }}>✕</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setEditingId(v.id); setPhoneInput(""); }} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }}>
                        + Link Phone
                      </button>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "var(--accent)" }}>
                    {v.visits || 0}
                  </td>
                  <td style={{ padding: 12, textAlign: "end", color: "var(--muted)" }}>
                    {new Date(v.lastSeen).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
