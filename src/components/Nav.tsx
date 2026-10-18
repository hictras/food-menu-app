"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";
import { useTheme } from "./ThemeProvider";
import { t } from "@/lib/i18n";
import PushSubscribe from "./PushSubscribe";

export default function Nav() {
  const { lang, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          {t(lang, "brand")}<span>.</span>
        </Link>

        <div className="nav-links">
          <Link href="/recipes" className="nav-link">
            {t(lang, "nav_recipes")}
          </Link>

          {/* EVERYONE CAN SEE THE INBOX */}
          <Link href="/inbox" className="nav-link">
            {lang === "ar" ? "📥 الرسائل" : "📥 Inbox"}
          </Link>

          {/* ONLY ADMIN CAN SEE ADD, PUSH, AND LOGOUT */}
          {loaded && isAdmin && (
            <>
	      <Link href="/settings" className="nav-link">
 	       ⚙️ {lang === "ar" ? "الإعدادات" : "Settings"}
	      </Link>
              <Link href="/recipes/new" className="nav-cta">
                {t(lang, "nav_add")}
              </Link>
              <Link href="/admin" className="nav-link">
                {lang === "ar" ? "🔔 إرسال إشعار" : "🔔 Send Push"}
              </Link>
              <button type="button" onClick={logout} className="nav-link nav-button">
                {lang === "ar" ? "خروج" : "Logout"}
              </button>
            </>
          )}

          {/* ONLY NON-ADMINS SEE THE LOGIN BUTTON */}
          {loaded && !isAdmin && (
            <Link href="/login" className="nav-link">
              {lang === "ar" ? "دخول" : "Login"}
            </Link>
          )}

          <PushSubscribe />

          <button
            type="button"
            onClick={toggleTheme}
            className="nav-icon-btn"
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button
            type="button"
            onClick={toggleLang}
            className="nav-icon-btn nav-lang"
            aria-label="Toggle language"
          >
            🌐 <span>{t(lang, "lang_toggle")}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
