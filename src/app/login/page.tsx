"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

export default function LoginPage() {
  const router = useRouter();
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
      // Full reload so Nav re-mounts and re-checks auth
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="form-card">
        <h1 style={{ marginTop: 0 }}>
          {lang === "ar" ? "تسجيل الدخول" : "Admin Login"}
        </h1>
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
            <p style={{ color: "var(--accent)", fontSize: 14 }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {busy
              ? "..."
              : lang === "ar" ? "دخول" : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
