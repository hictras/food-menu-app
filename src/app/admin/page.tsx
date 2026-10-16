"use client";

import { useState } from "react";

export default function AdminPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  const [title, setTitle] = useState("Menu");
  const [body, setBody] = useState("New recipe added!");
  const [url, setUrl] = useState("/");

  async function send() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
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
      <h1>Send Push Notification</h1>

      <div className="form-card">
        <div className="field">
          <label>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Body</label>
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="field">
          <label>URL to open when tapped</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/" />
        </div>

        <button className="btn btn-primary" onClick={send} disabled={busy}>
          {busy ? "Sending..." : "Send test notification"}
        </button>

        {result && (
          <pre style={{ marginTop: 16, fontSize: 13, background: "#f5f5f5", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}
