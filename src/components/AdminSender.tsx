"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";

type Recipe = { id: number; name: string; nameAr: string | null; imageUrl: string | null; };
type Recipient = { id: number; phoneNumber: string | null; name: string | null; };
type Preset = { id: number; name: string; title: string; body: string; pollQuestion: string | null; };

const LOCATION_PRESETS = ["Parent's house", "Home", "Beach house", "Work", "Other"];

export default function AdminSender() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [busy, setBusy] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");

  const [title, setTitle] = useState("Menu");
  const [body, setBody] = useState("New recipe added!");
  const [location, setLocation] = useState("");
  const [noDish, setNoDish] = useState(false);
  const [url, setUrl] = useState("");

  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [groups, setGroups] = useState<{ id: number, name: string, phones: string[] }[]>([]);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/recipes").then(res => res.json()).then(data => setRecipes(Array.isArray(data) ? data : []));
    fetch("/api/recipients").then(res => res.json()).then(data => setRecipients(Array.isArray(data) ? data : []));
    fetch("/api/recipients/groups").then(res => res.json()).then(data => setGroups(Array.isArray(data) ? data : []));
    fetch("/api/visitors").then(res => res.json()).then(data => setVisitorCount(data.count));
    fetch("/api/push/presets").then(res => res.json()).then(data => setPresets(Array.isArray(data) ? data : []));
  }, []);

  const filteredRecipients = useMemo(() => {
    if (!phoneSearch.trim()) return recipients.filter(r => r.phoneNumber);
    const lower = phoneSearch.toLowerCase();
    return recipients.filter(r => {
      if (!r.phoneNumber) return false;
      return r.phoneNumber.includes(lower) || (r.name && r.name.toLowerCase().includes(lower));
    });
  }, [recipients, phoneSearch]);

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return recipes;
    const lower = recipeSearch.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(lower) || (r.nameAr && r.nameAr.includes(lower)));
  }, [recipes, recipeSearch]);

  function togglePhone(phone: string | null) {
    if (!phone) return;
    setSelectedPhones(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  }

  function selectRecipe(id: number) {
    setUrl(`/recipes/${id}?today`);
    setRecipeSearch("");
    setShowRecipeDropdown(false);
  }

  function insertName(target: "title" | "body") {
    const ref = target === "title" ? titleRef : bodyRef;
    const setter = target === "title" ? setTitle : setBody;
    const val = target === "title" ? title : body;

    if (!ref.current) return;
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const newValue = val.substring(0, start) + "{name}" + val.substring(end);

    setter(newValue);

    setTimeout(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(start + 6, start + 6);
    }, 0);
  }


  function insertTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setUrl(`/calendar/${yyyy}-${mm}-${dd}`);
  }


  function insertYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    setUrl(`/calendar/${yyyy}-${mm}-${dd}`);
  }

  async function savePreset(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("presetName") as HTMLInputElement).value;
    const pTitle = (form.elements.namedItem("presetTitle") as HTMLInputElement).value;
    const pBody = (form.elements.namedItem("presetBody") as HTMLInputElement).value;
    const pPoll = (form.elements.namedItem("presetPoll") as HTMLInputElement).value;

    if (!name || !pTitle || !pBody) return;

    const method = editingPreset ? "PUT" : "POST";
    const payload = editingPreset ? { id: editingPreset.id, name, title: pTitle, body: pBody, pollQuestion: pPoll } : { name, title: pTitle, body: pBody, pollQuestion: pPoll };

    await fetch("/api/push/presets", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await fetch("/api/push/presets").then(r => r.json());
    setPresets(updated);
    setEditingPreset(null);
    form.reset();
  }

  async function deletePreset(id: number) {
    if (!window.confirm(isAr ? ar.pushPresets.deleteConfirm : "Delete this preset?")) return;
    await fetch("/api/push/presets?id=" + id, { method: "DELETE" });
    setPresets(presets.filter(p => p.id !== id));
  }

  async function send() {
    if (pollEnabled && !pollQuestion.trim()) {
      setResult(JSON.stringify({ error: "Poll question is required" }, null, 2));
      return;
    }

    setBusy(true);
    setResult("");
    try {
      const target = selectedPhones.length > 0 ? selectedPhones.join(",") : "all";

      const finalUrl = noDish ? "/no-dish-today" : url.trim();
      const finalTitle = noDish && !title.trim() ? "No dish today" : title;
      const finalBody = noDish && !body.trim() ? "Sorry — no dish for today. Check back tomorrow!" : body;
      
      const payload: Record<string, unknown> = { title: finalTitle, body: finalBody, url: finalUrl, targetPhone: target };
      
      if (pollEnabled && pollQuestion.trim()) {
        payload.poll = { question: pollQuestion.trim() };
      }

      if (location.trim()) {
        payload.location = location.trim();
      }

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));

      if (res.ok && data.pollId) {
        setPollEnabled(false);
        setPollQuestion("");
      }
    } catch (err) {
      setResult(String(err));
    } finally {
      setBusy(false);
    }
  }

  const previewRecipe = useMemo(() => {
    const match = url.match(/\/recipes\/(\d+)/);
    if (match) return recipes.find(r => r.id === parseInt(match[1]));
    return null;
  }, [url, recipes]);

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <h1>{isAr ? ar.pushPresets.title : "Send Push Notification"}</h1>
        {visitorCount !== null && (
          <div style={{ fontSize: 13, color: "var(--muted)", background: "var(--surface-2)", padding: "4px 12px", borderRadius: 999, border: "1px solid var(--line)" }}>
            📱 {isAr ? ar.pushPresets.devices : "Devices"}: <strong style={{ color: "var(--ink)" }}>{visitorCount}</strong>
          </div>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => setShowPresetManager(!showPresetManager)}>
          ⚙️ {isAr ? ar.pushPresets.title : "Manage Presets"}
        </button>
      </div>

      {showPresetManager && (
        <div className="form-card" style={{ marginBottom: 24, background: "var(--surface-2)" }}>
          <h2 style={{ marginBottom: 16 }}>
            {editingPreset ? (isAr ? ar.pushPresets.editPreset : "Edit Preset") : (isAr ? ar.pushPresets.newPreset : "New Preset")}
          </h2>
          <form onSubmit={savePreset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input name="presetName" className="preset-input" placeholder={isAr ? ar.pushPresets.presetName : "Preset Name"} defaultValue={editingPreset?.name} required />
            <input name="presetTitle" className="preset-input" placeholder={isAr ? ar.pushPresets.presetTitle : "Title"} defaultValue={editingPreset?.title} required />
            <input name="presetBody" className="preset-input" placeholder={isAr ? ar.pushPresets.presetBody : "Body"} defaultValue={editingPreset?.body} required />
            <input name="presetPoll" className="preset-input" placeholder="Poll Question (Optional)" defaultValue={editingPreset?.pollQuestion || ""} />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary">
                {editingPreset ? (isAr ? ar.pushPresets.updatePreset : "Update") : (isAr ? ar.pushPresets.addPreset : "Add Preset")}
              </button>
              {editingPreset && (
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPreset(null)}>
                  {isAr ? ar.pushPresets.cancel : "Cancel"}
                </button>
              )}
            </div>
          </form>

          <div style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <h3 style={{ marginBottom: 12 }}>{isAr ? ar.pushPresets.savedPresets : "Saved Presets"}</h3>
            {presets.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderBottom: "1px solid var(--line)" }}>
                <span><strong>{p.name}</strong> — {p.title}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setEditingPreset(p)}>{isAr ? ar.pushPresets.edit : "Edit"}</button>
                  <button type="button" className="btn btn-danger" style={{ padding: "4px 8px" }} onClick={() => deletePreset(p.id)}>{isAr ? ar.pushPresets.delete : "Delete"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {presets.map(p => (
            <button key={p.id} type="button" className="chip" onClick={() => { setTitle(p.title); setBody(p.body); if (p.pollQuestion) { setPollEnabled(true); setPollQuestion(p.pollQuestion); } else { setPollEnabled(false); setPollQuestion(""); } }}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="field" style={{ position: "relative" }}>
          <label>{isAr ? "المستلمون (اتركه فارغاً للجميع)" : "Recipients (leave empty for all)"}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)", marginBottom: 8 }}>
            {selectedPhones.map(phone => {
              const rec = recipients.find(r => r.phoneNumber === phone);
              return (
                <span key={phone} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 6, fontSize: 12 }}>
                  {rec?.name ? rec.name + " (" + phone + ")" : phone}
                  <button type="button" onClick={() => togglePhone(phone)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}>✕</button>
                </span>
              );
            })}
            {selectedPhones.length === 0 && <span style={{ color: "var(--muted)", fontSize: 12, padding: 4 }}>Everyone</span>}
          </div>
          {groups.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center" }}>{isAr ? ar.groups.selectGroup : "Groups:"}</span>
            {groups.map(g => (
              <button key={g.id} type="button" className="chip" onClick={() => setSelectedPhones(Array.from(new Set([...selectedPhones, ...g.phones])))}>
                👥 {g.name} ({g.phones.length})
              </button>
            ))}
          </div>
        )}
          <input type="text" placeholder="Search by name or phone..." value={phoneSearch} onChange={(e) => { setPhoneSearch(e.target.value); setShowRecipientDropdown(true); }} onFocus={() => setShowRecipientDropdown(true)} style={{ width: "100%", padding: 8 }} />
          {showRecipientDropdown && phoneSearch.trim() !== "" && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowRecipientDropdown(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipients.length === 0 ? <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipients found</div> : filteredRecipients.map(r => (
                  <div key={r.id} onClick={() => { togglePhone(r.phoneNumber); setPhoneSearch(""); setShowRecipientDropdown(false); }} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <strong>{r.name || "Unnamed"}</strong> <span style={{ color: "var(--muted)" }}>({r.phoneNumber})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label>{isAr ? ar.pushPresets.presetTitle : "Title"}</label>
            <button type="button" className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => insertName("title")}>
              + {isAr ? ar.pushPresets.insertName : "{name}"}
            </button>
          </div>
          <textarea ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", minHeight: 60, resize: "vertical" }} />
        </div>

        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label>{isAr ? ar.pushPresets.presetBody : "Body"}</label>
            <button type="button" className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => insertName("body")}>
              + {isAr ? ar.pushPresets.insertName : "{name}"}
            </button>
          </div>
          <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", minHeight: 80, resize: "vertical" }} />
        </div>

        <div className="field">
          <label>{isAr ? "المكان (اختياري)" : "Location (optional)"}</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={isAr ? "بيت الأهل، البيت، الشاليه" : "Parent's house, Home, Beach house"} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {LOCATION_PRESETS.map(p => (
              <button key={p} type="button" className="chip" onClick={() => setLocation(p)} style={{ fontSize: 11, cursor: "pointer" }}>📍 {p}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: 14, background: "var(--bg)", border: pollEnabled ? "1px solid var(--accent)" : "1px solid var(--line)", borderRadius: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", margin: 0 }}>
            <input type="checkbox" checked={pollEnabled} onChange={(e) => setPollEnabled(e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>📊 {isAr ? ar.pushPresets.addPoll : "Add a poll"}</span>
          </label>
          {pollEnabled && (
            <input type="text" placeholder={isAr ? ar.pushPresets.questionPlaceholder : "Question..."} value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} style={{ width: "100%", marginTop: 12, padding: 8, borderRadius: 8, border: "1px solid var(--line)" }} />
          )}
        </div>

        <div className="field" style={{ position: "relative" }}>
          <label>{isAr ? "ابحث عن وصفة لربطها (اختياري)" : "Search Recipe (Optional)"}</label>
          <input type="text" placeholder="Type recipe name..." value={recipeSearch} onChange={(e) => { setRecipeSearch(e.target.value); setShowRecipeDropdown(true); }} onFocus={() => setShowRecipeDropdown(true)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          {showRecipeDropdown && recipeSearch.trim() !== "" && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowRecipeDropdown(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipes.length === 0 ? <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipes found</div> : filteredRecipes.map(r => (
                  <div key={r.id} onClick={() => selectRecipe(r.id)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    {isAr && r.nameAr ? r.nameAr : r.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={noDish} onChange={(e) => setNoDish(e.target.checked)} />
            <span style={{ fontWeight: 600 }}>🍽 {isAr ? "لا يوجد طبق اليوم" : "No dish today"}</span>
          </label>
        </div>

        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label>{isAr ? ar.pushPresets.optionalUrl : "URL (Optional)"}</label>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={insertTodayDate}>
                📅 {isAr ? ar.todayBtn : "Today"}
              </button>
              <button type="button" className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={insertYesterdayDate}>
                📅 {isAr ? ar.yesterdayBtn : "Yesterday"}
              </button>
            </div>
          </div>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/recipes/3" style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>

        {url.trim() !== "" && !pollEnabled && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Inbox Preview</label>
            <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Just now</span>
              </div>
              <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--ink-soft)" }}>{body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8 }}>
                {previewRecipe?.imageUrl ? <img src={previewRecipe.imageUrl} alt="Preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 60, height: 60, borderRadius: 6, background: "var(--line)" }} />}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <strong style={{ fontSize: 13, color: "var(--accent)" }}>{previewRecipe ? previewRecipe.name : "View Link"}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{url}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={send} disabled={busy} style={{ width: "100%", padding: 12 }}>
          {busy ? (isAr ? ar.pushPresets.sending : "Sending...") : (isAr ? ar.pushPresets.send : "Send")}
        </button>

        {result && <pre style={{ marginTop: 16, fontSize: 13, background: "var(--bg)", padding: 12, borderRadius: 8, overflow: "auto" }}>{result}</pre>}
      </div>
    </main>
  );
}