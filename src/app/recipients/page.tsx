"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type Recipient = {
  id: number;
  phoneNumber: string | null;
  name: string | null;
  excluded: number;
};

export default function RecipientsPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (!data.admin) router.push("/login");
        else loadRecipients();
      });
  }, [router]);

  function loadRecipients() {
    fetch("/api/recipients")
      .then(res => res.json())
      .then(data => {
        // Filter out any old subscriptions that don't have a phone number
        const validRecipients = Array.isArray(data) ? data.filter((r: Recipient) => r.phoneNumber) : [];
        setRecipients(validRecipients);
        setLoading(false);
      });
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this recipient?")) return;
    await fetch(`/api/recipients?id=${id}`, { method: "DELETE" });
    loadRecipients();
  }

  async function handleSave(id: number) {
    if (!editPhone.trim()) {
      alert("Phone number cannot be empty.");
      return;
    }
    await fetch("/api/recipients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName, phoneNumber: editPhone }),
    });
    setEditId(null);
    loadRecipients();
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading...</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "المستلمون" : "Recipients"}</h1>
      </div>
      <p className="page-sub">
        {lang === "ar" ? "إدارة قائمة المستلمين" : "Manage your subscriber list"}
      </p>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>Name</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>Phone Number</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>Excluded</th>
              <th style={{ padding: 12, textAlign: "end", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No recipients yet.</td>
              </tr>
            ) : (
              recipients.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  {editId === r.id ? (
                    <>
                      <td style={{ padding: 8 }}>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%", padding: 6 }} placeholder="Name" />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: "100%", padding: 6 }} placeholder="Phone" />
                      </td>
                      <td style={{ padding: 8, textAlign: "end" }}>
                        <button onClick={() => handleSave(r.id)} className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12, marginRight: 4 }}>Save</button>
                        <button onClick={() => setEditId(null)} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: 12 }}>{r.name || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Unnamed</span>}</td>
                      <td style={{ padding: 12 }}>{r.phoneNumber}</td>
                      <td style={{ padding: 12, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={r.excluded === 1}
                          onChange={async (e) => {
                            await fetch("/api/recipients", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: r.id,
                                name: r.name || "",
                                phoneNumber: r.phoneNumber || "",
                                excluded: e.target.checked,
                              }),
                            });
                            loadRecipients();
                          }}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: 12, textAlign: "end" }}>
                        <button onClick={() => { setEditId(r.id); setEditName(r.name || ""); setEditPhone(r.phoneNumber || ""); }} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12, marginRight: 4 }}>Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 12 }}>Delete</button>
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
