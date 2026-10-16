"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";

export default function LoginPage() {
  const { lang } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="login-card">
      <h1>{lang === "ar" ? "تسجيل الدخول" : "Sign in"}</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label>{lang === "ar" ? "اسم المستخدم" : "Username"}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label>{lang === "ar" ? "كلمة المرور" : "Password"}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p style={{ color: "var(--accent)", fontSize: 12, margin: "0 0 12px" }}>{error}</p>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy}
          style={{ width: "100%", justifyContent: "center", padding: "10px 16px" }}
        >
          {busy ? "…" : lang === "ar" ? "دخول" : "Continue"}
        </button>
      </form>
    </div>
  );
}
