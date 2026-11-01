"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { useModal } from "@/components/ModalProvider";

type Word = { id: number; ar: string; en: string; };

export default function DictionaryAdminPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const { confirm, show } = useModal();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.admin) router.push("/login");
      else load();
    });
  }, [router]);

  function load() {
    fetch("/api/dictionary").then(r => r.json()).then(d => {
      setWords(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!newAr.trim() || !newEn.trim()) return;
    setSaving(true);
    const res = await fetch("/api/dictionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ar: newAr, en: newEn }),
    });
    setSaving(false);
    if (res.ok) {
      setNewAr(""); setNewEn("");
      load();
    } else {
      const d = await res.json();
      show({ message: d.error || "Failed", tone: "danger" });
    }
  }

  async function deleteWord(id: number) {
    const ok = await confirm({ message: isAr ? "حذف هذه الكلمة؟" : "Delete this word?", tone: "danger" });
    if (!ok) return;
    await fetch(`/api/dictionary?id=${id}`, { method: "DELETE" });
    load();
  }

  const filtered = words.filter(w => 
    w.ar.includes(search) || w.en.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading...</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-head">
        <h1>{isAr ? "قاموس البحث" : "Search Dictionary"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? "أضف كلمات لتحسين البحث بالعربية (مثال: حليب -> milk)" : "Add words to improve Arabic search (e.g., حليب -> milk)"}
      </p>

      {/* Add Word Form */}
      <form onSubmit={addWord} className="form-card" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 24 }}>
        <div className="field" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
          <label>{isAr ? "الكلمة العربية" : "Arabic Word"}</label>
          <input type="text" value={newAr} onChange={e => setNewAr(e.target.value)} dir="rtl" style={{ width: "100%", padding: 10 }} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
          <label>{isAr ? "الترجمة الإنجليزية" : "English Translation"}</label>
          <input type="text" value={newEn} onChange={e => setNewEn(e.target.value)} dir="ltr" style={{ width: "100%", padding: 10 }} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: "10px 20px" }}>
          {saving ? "..." : isAr ? "+ إضافة" : "+ Add"}
        </button>
      </form>

      {/* Search and List */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ width: "100%" }}>
          <span className="search-icon">🔍</span>
          <input type="text" className="search-input" placeholder={isAr ? "ابحث في القاموس..." : "Search dictionary..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start" }}>Arabic</th>
              <th style={{ padding: 12, textAlign: "start" }}>English</th>
              <th style={{ padding: 12, textAlign: "center", width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 12, fontSize: 15, fontWeight: 600 }} dir="rtl">{w.ar}</td>
                <td style={{ padding: 12, color: "var(--ink-soft)" }}>{w.en}</td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <button onClick={() => deleteWord(w.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 16 }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
