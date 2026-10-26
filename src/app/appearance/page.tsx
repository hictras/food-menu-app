"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { ar } from "@/lib/ar";

export default function AppearancePage() {
  const { lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const isAr = lang === "ar";
  const [fontSize, setFontSize] = useState("16px");

  useEffect(() => {
    const saved = localStorage.getItem("font_size") || "16px";
    setFontSize(saved);

    fetch("/api/user-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.font_size) {
          setFontSize(data.font_size);
          document.documentElement.style.fontSize = data.font_size;
          localStorage.setItem("font_size", data.font_size);
        }
        if (data.theme) {
          setTheme(data.theme as "dark" | "light");
        }
        if (data.lang) {
          setLang(data.lang as "en" | "ar");
        }
      })
      .catch(() => {});
  }, []);

  function handleFontSize(size: string) {
    setFontSize(size);
    localStorage.setItem("font_size", size);
    document.documentElement.style.fontSize = size;
    fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "font_size", value: size }),
    }).catch(() => {});
  }

  function handleTheme(t: "dark" | "light") {
    setTheme(t);
    fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "theme", value: t }),
    }).catch(() => {});
  }

  function handleLang(l: "en" | "ar") {
    document.cookie = `lang=${l}; path=/; max-age=31536000`;
    setLang(l);
    fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "lang", value: l }),
    }).catch(() => {});
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 600 }}>
      
      {/* Back Button on its own line at the top left */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => window.history.back()} className="btn btn-ghost" style={{ fontSize: "0.75rem" }}>
          {isAr ? ar.appearance.back : "← Back"}
        </button>
      </div>

      {/* Title Centered */}
      <div className="page-head" style={{ textAlign: "center" }}>
        <h1>{isAr ? ar.appearance.title : "Appearance"}</h1>
      </div>
      <p className="page-sub" style={{ textAlign: "center" }}>
        {isAr ? ar.appearance.subtitle : "Customize how the app looks and feels."}
      </p>

      {/* LANGUAGE */}
      <div className="form-section">
        <h2>{isAr ? ar.appearance.language : "Language"}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className={`btn ${lang === "en" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleLang("en")}
            style={{ flex: 1, padding: "16px" }}
          >
            {ar.appearance.english}
          </button>
          <button
            type="button"
            className={`btn ${lang === "ar" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleLang("ar")}
            style={{ flex: 1, padding: "16px" }}
          >
            {ar.appearance.arabic}
          </button>
        </div>
      </div>

      {/* THEME */}
      <div className="form-section">
        <h2>{isAr ? ar.appearance.theme : "Theme"}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className={`btn ${theme === "dark" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleTheme("dark")}
            style={{ flex: 1, padding: "16px" }}
          >
            {isAr ? ar.appearance.dark : "Dark"} ☾
          </button>
          <button
            type="button"
            className={`btn ${theme === "light" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleTheme("light")}
            style={{ flex: 1, padding: "16px" }}
          >
            {isAr ? ar.appearance.light : "Light"} ☀
          </button>
        </div>
      </div>

      {/* FONT SIZE */}
      <div className="form-section">
        <h2>{isAr ? ar.appearance.textSize : "Text Size"}</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn ${fontSize === "14px" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleFontSize("14px")}
            style={{ flex: 1, minWidth: 120, padding: "16px" }}
          >
            {isAr ? ar.appearance.small : "Small"} A-
          </button>
          <button
            type="button"
            className={`btn ${fontSize === "16px" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleFontSize("16px")}
            style={{ flex: 1, minWidth: 120, padding: "16px" }}
          >
            {isAr ? ar.appearance.normal : "Default"} A
          </button>
          <button
            type="button"
            className={`btn ${fontSize === "18px" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleFontSize("18px")}
            style={{ flex: 1, minWidth: 120, padding: "16px" }}
          >
            {isAr ? ar.appearance.large : "Large"} A+
          </button>
          <button
            type="button"
            className={`btn ${fontSize === "20px" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleFontSize("20px")}
            style={{ flex: 1, minWidth: 120, padding: "16px" }}
          >
            {isAr ? ar.appearance.extraLarge : "Extra Large"} A++
          </button>
        </div>
      </div>
    </main>
  );
}
