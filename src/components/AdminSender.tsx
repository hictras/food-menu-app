"use client";

import { useState } from "react";
import { useLang } from "./LanguageProvider";

export default function AdminSender() {
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  const [title, setTitle] = useState("Menu");
  const [body, setBody] = useState("New recipe added!");
  const [url, setUrl] = useState("/inbox");
  const [targetDevice, setTargetDevice] = useState(""); // NEW

  async function send() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url, targetDevice }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1>{lang === "ar" ? "إرسال إشعار" : "Send Push Notification"}</h1>
      <div className="form-card">
        <div className="field">
          <label>{lang === "ar" ? "جهاز محدد (اختياري)" : "Target Device (Optional)"}</label>
          <input
            type="text"
            value={targetDevice}
            onChange={(e) => setTargetDevice(e.target.value)}
            placeholder="e.g. Hicham's iPhone (leave blank to send to all)"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
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
          <label>{lang === "ar" ? "الرابط" : "URL"}</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
        </div>
        
        <button className="btn btn-primary" onClick={send} disabled={busy} style={{ width: "100%", padding: 12 }}>
          {busy ? "Sending..." : lang === "ar" ? "إرسال" : "Send"}
        </button>

        {result && (
          <pre style={{ marginTop: 16, fontSize: 13, background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}
