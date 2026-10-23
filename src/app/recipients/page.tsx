"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type Recipient = { id: number; phoneNumber: string | null; name: string | null; excluded: number; };
type Group = { id: number; name: string; phones: string[]; };

export default function RecipientsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupPhones, setSelectedGroupPhones] = useState<string[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (!data.admin) router.push("/login");
        else loadData();
      });
  }, [router]);

  function loadData() {
    Promise.all([
      fetch("/api/recipients").then(r => r.json()),
      fetch("/api/recipients/groups").then(r => r.json())
    ]).then(([recs, grps]) => {
      setRecipients(Array.isArray(recs) ? recs.filter((r: Recipient) => r.phoneNumber) : []);
      setGroups(Array.isArray(grps) ? grps : []);
      setLoading(false);
    });
  }

  async function createGroup() {
    if (!newGroupName.trim() || selectedGroupPhones.length === 0) return;
    await fetch("/api/recipients/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName, phones: selectedGroupPhones }),
    });
    setNewGroupName("");
    setSelectedGroupPhones([]);
    setShowGroupForm(false);
    loadData();
  }

  async function deleteGroup(id: number) {
    if (!window.confirm(isAr ? ar.groups.deleteConfirm : "Delete this group?")) return;
    await fetch(`/api/recipients/groups?id=${id}`, { method: "DELETE" });
    loadData();
  }

  function toggleGroupPhone(phone: string) {
    setSelectedGroupPhones(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.groups.loading : "Loading..."}</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{isAr ? ar.groups.recipientsTitle : "Recipients"}</h1>
      </div>
      
      <div className="form-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isAr ? ar.groups.title : "Groups"}</h2>
          <button type="button" className="btn btn-primary" onClick={() => setShowGroupForm(!showGroupForm)}>
            {isAr ? ar.groups.newGroup : "+ New Group"}
          </button>
        </div>

        {showGroupForm && (
          <div style={{ padding: 16, background: "var(--bg)", borderRadius: 8, marginBottom: 16 }}>
            <input type="text" placeholder={isAr ? ar.groups.groupName : "Group Name"} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid var(--line)" }} />
            <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 6, padding: 8, marginBottom: 12 }}>
              {recipients.map(r => (
                <label key={r.id} style={{ display: "flex", gap: 8, padding: 4 }}>
                  <input type="checkbox" checked={selectedGroupPhones.includes(r.phoneNumber!)} onChange={() => toggleGroupPhone(r.phoneNumber!)} />
                  {r.name || (isAr ? ar.groups.unnamed : "Unnamed")} ({r.phoneNumber})
                </label>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={createGroup}>{isAr ? ar.groups.createBtn : "Create Group"}</button>
          </div>
        )}

        {groups.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {groups.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--line)" }}>
                <span style={{ fontWeight: 600 }}>👥 {g.name}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>({g.phones.length})</span>
                <button type="button" onClick={() => deleteGroup(g.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{isAr ? ar.groups.noGroups : "No groups yet."}</p>
        )}
      </div>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.groups.recipientName : "Name"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? ar.groups.recipientPhone : "Phone Number"}</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 12 }}>{r.name || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{isAr ? ar.groups.unnamed : "Unnamed"}</span>}</td>
                <td style={{ padding: 12 }}>{r.phoneNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
