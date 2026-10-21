"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLang } from "./LanguageProvider";

type Recipe = { id: number; name: string; nameAr: string | null; imageUrl: string | null; };
type Recipient = { id: number; phoneNumber: string | null; name: string | null; };

export default function AdminSender() {
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");

  const [title, setTitle] = useState("Menu");
  const [body, setBody] = useState("New recipe added!");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");

  const [pollEnabled, setPollEnabled] = useState(false);
  const [personalize, setPersonalize] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/recipes").then(res => res.json()).then(data => setRecipes(Array.isArray(data) ? data : []));
    fetch("/api/recipients").then(res => res.json()).then(data => setRecipients(Array.isArray(data) ? data : []));
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
    // Store RELATIVE url — no baseUrl prefix
    setUrl(`/recipes/${id}?today`);
    setRecipeSearch("");
    setShowRecipeDropdown(false);
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

      // Send url as-is. Relative paths stay relative. Absolute stays absolute.
      const payload: Record<string, unknown> = { title, body, url: url.trim(), targetPhone: target };
      if (pollEnabled && pollQuestion.trim()) {
        payload.poll = { question: pollQuestion.trim() };
      }
      if (personalize) {
        payload.personalize = true;
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
      <h1>{lang === "ar" ? "إرسال إشعار" : "Send Push Notification"}</h1>

      <div className="form-card">

        <div className="field" style={{ position: "relative" }}>
          <label>{lang === "ar" ? "المستلمون (اتركه فارغاً للجميع)" : "Recipients (leave empty for all)"}</label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)", marginBottom: 8 }}>
            {selectedPhones.map(phone => {
              const rec = recipients.find(r => r.phoneNumber === phone);
              return (
                <span key={phone} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 6, fontSize: 12 }}>
                  {rec?.name ? `${rec.name} (${phone})` : phone}
                  <button type="button" onClick={() => togglePhone(phone)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}>✕</button>
                </span>
              );
            })}
            {selectedPhones.length === 0 && <span style={{ color: "var(--muted)", fontSize: 12, padding: 4 }}>Everyone</span>}
          </div>

          <input
            type="text"
            placeholder="Search by name or phone..."
            value={phoneSearch}
            onChange={(e) => { setPhoneSearch(e.target.value); setShowRecipientDropdown(true); }}
            onFocus={() => setShowRecipientDropdown(true)}
            style={{ width: "100%", padding: 8 }}
          />

          {showRecipientDropdown && phoneSearch.trim() !== "" && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowRecipientDropdown(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipients.length === 0 ? (
                  <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipients found</div>
                ) : (
                  filteredRecipients.map(r => (
                    <div key={r.id} onClick={() => { togglePhone(r.phoneNumber); setPhoneSearch(""); setShowRecipientDropdown(false); }} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <strong>{r.name || "Unnamed"}</strong> <span style={{ color: "var(--muted)" }}>({r.phoneNumber})</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ marginBottom: 16, padding: 14, background: "var(--bg)", border: personalize ? "1px solid var(--accent)" : "1px solid var(--line)", borderRadius: 10, transition: "border-color 0.15s" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", margin: 0 }}>
            <input
              type="checkbox"
              checked={personalize}
              onChange={(e) => setPersonalize(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              {lang === "ar" ? "تخصيص بالاسم" : "Personalize with {name}"}
            </span>
          </label>
          {personalize && (
            <p className="helper" style={{ marginTop: 8, marginBottom: 0 }}>
              {lang === "ar"
                ? "استخدم {name} في العنوان أو النص لإدراج اسم المستلم."
                : "Use {name} in the title or body to insert each recipient's name."}
            </p>
          )}
        </div>

        <div className="field">
          <label>{lang === "ar" ? "العنوان" : "Title"}</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>
        <div className="field">
          <label>{lang === "ar" ? "النص" : "Body"}</label>
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>

        <div className="field">
          <label>{lang === "ar" ? "المكان (اختياري)" : "Location (optional)"}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={lang === "ar" ? "بيت أمي، البيت، الشاليه" : "Mother house, Home, Beach house"}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <p className="helper" style={{ marginTop: 0, marginBottom: 12 }}>
            {lang === "ar" ? "سيظهر في الإشعار وصندوق الرسائل" : "Shown in push notification and inbox"}
          </p>
        </div>

        <div style={{ marginBottom: 16, padding: 14, background: "var(--bg)", border: pollEnabled ? "1px solid var(--accent)" : "1px solid var(--line)", borderRadius: 10, transition: "border-color 0.15s" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", margin: 0 }}>
            <input
              type="checkbox"
              checked={pollEnabled}
              onChange={(e) => setPollEnabled(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              📊 {lang === "ar" ? "إضافة استطلاع (نعم / لا)" : "Add a poll (Yes / No)"}
            </span>
          </label>

          {pollEnabled && (
            <div style={{ marginTop: 12 }}>
              <input
                type="text"
                placeholder={lang === "ar" ? "السؤال (مثال: هل أنت قادم للعشاء الجمعة؟)" : "Question (e.g. Coming to dinner Friday?)"}
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
              />
              <p className="helper" style={{ marginTop: 6 }}>
                {lang === "ar"
                  ? "سيظهر السؤال كعنوان الإشعار."
                  : "The question becomes the notification title."}
              </p>
            </div>
          )}
        </div>

        <div className="field" style={{ position: "relative" }}>
          <label>{lang === "ar" ? "ابحث عن وصفة لربطها (اختياري)" : "Search Recipe (Optional)"}</label>
          <input
            type="text"
            placeholder="Type recipe name..."
            value={recipeSearch}
            onChange={(e) => { setRecipeSearch(e.target.value); setShowRecipeDropdown(true); }}
            onFocus={() => setShowRecipeDropdown(true)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />

          {showRecipeDropdown && recipeSearch.trim() !== "" && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowRecipeDropdown(false)} />
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflowY: "auto", background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, marginTop: 4, boxShadow: "var(--shadow-lg)" }}>
                {filteredRecipes.length === 0 ? (
                  <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>No recipes found</div>
                ) : (
                  filteredRecipes.map((r) => (
                    <div key={r.id} onClick={() => selectRecipe(r.id)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      {lang === "ar" && r.nameAr ? r.nameAr : r.name}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="field">
          <label>{lang === "ar" ? "الرابط (اختياري)" : "URL (Optional)"}</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/recipes/3 or leave empty" style={{ width: "100%", padding: 8, marginBottom: 12 }} />
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

        {pollEnabled && pollQuestion.trim() && (
          <div style={{ marginBottom: 24, padding: 14, background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", marginBottom: 6 }}>
              {lang === "ar" ? "معاينة الاستطلاع" : "Poll preview"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{pollQuestion}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {lang === "ar" ? "المستلمون سيرون أزرار نعم / لا" : "Recipients will see Yes / No buttons"}
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={send} disabled={busy} style={{ width: "100%", padding: 12 }}>
          {busy ? "Sending..." : pollEnabled ? (lang === "ar" ? "إرسال مع استطلاع" : "Send with poll") : "Send"}
        </button>

        {result && <pre style={{ marginTop: 16, fontSize: 13, background: "var(--bg)", padding: 12, borderRadius: 8, overflow: "auto" }}>{result}</pre>}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
          <Link href="/inbox" className="btn btn-ghost" style={{ fontSize: 12 }}>
            📥 {lang === "ar" ? "فتح صندوق الرسائل" : "Open inbox"}
          </Link>
        </div>
      </div>
    </main>
  );
}
