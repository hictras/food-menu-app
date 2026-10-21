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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoaded(true));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.logo_url) setLogoUrl(data.logo_url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!menuOpen && !mobileOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-menu") && !target.closest(".nav-menu-toggle")) {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen, mobileOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function closeAll() {
    setMenuOpen(false);
    setMobileOpen(false);
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand" onClick={closeAll}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="nav-logo" />
          ) : (
            <>{t(lang, "brand")}<span>.</span></>
          )}
        </Link>

        {/* Recipes — always visible (mobile + desktop) */}
        <Link href="/recipes" className="nav-link nav-recipes-main" onClick={closeAll}>
          {t(lang, "nav_recipes")}
        </Link>

        {/* Desktop-only links */}
        <div className="nav-links nav-desktop-only">
          <Link href="/calendar" className="nav-link">
            {lang === "ar" ? "التقويم" : "Calendar"}
          </Link>

          <Link href="/inbox" className="nav-link">
            {lang === "ar" ? "الرسائل" : "Inbox"}
          </Link>

          {loaded && isAdmin && (
            <div className="nav-menu-wrap">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="nav-menu-toggle"
                aria-label="Admin menu"
                aria-expanded={menuOpen}
              >
                ☰ {lang === "ar" ? "الإدارة" : "Admin"}
              </button>

              {menuOpen && (
                <div className="nav-menu">
                  <Link href="/admin/import" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "استيراد وصفات" : "Import recipes"}
                  </Link>
                  <Link href="/recipes/new" className="nav-menu-item" onClick={closeAll}>
                    ✚ {t(lang, "nav_add")}
                  </Link>
                  <Link href="/replies" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "الردود" : "Replies"}
                  </Link>
                  <Link href="/admin" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "إرسال إشعار" : "Send Push"}
                  </Link>
                  <Link href="/recipients" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "المستلمون" : "Recipients"}
                  </Link>
                  <Link href="/whatsapp" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "واتساب" : "WhatsApp"}
                  </Link>
                  <Link href="/settings" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "الإعدادات" : "Settings"}
                  </Link>
                  <div className="nav-menu-divider" />
                  <button
                    type="button"
                    onClick={logout}
                    className="nav-menu-item nav-menu-danger"
                  >
                    {lang === "ar" ? "خروج" : "Logout"}
                  </button>
                </div>
              )}
            </div>
          )}

          {loaded && !isAdmin && (
            <Link href="/login" className="nav-link">
              {lang === "ar" ? "دخول" : "Login"}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="nav-menu-wrap nav-mobile-only">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="nav-menu-toggle"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            ☰
          </button>

          {mobileOpen && (
            <div className="nav-menu">
              <Link href="/calendar" className="nav-menu-item" onClick={closeAll}>
                {lang === "ar" ? "التقويم" : "Calendar"}
              </Link>
              <Link href="/inbox" className="nav-menu-item" onClick={closeAll}>
                {lang === "ar" ? "الرسائل" : "Inbox"}
              </Link>

              {loaded && isAdmin && (
                <>
                  <div className="nav-menu-divider" />
                  <Link href="/admin/import" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "استيراد وصفات" : "Import recipes"}
                  </Link>
                  <Link href="/recipes/new" className="nav-menu-item" onClick={closeAll}>
                    ✚ {t(lang, "nav_add")}
                  </Link>
                  <Link href="/replies" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "الردود" : "Replies"}
                  </Link>
                  <Link href="/admin" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "إرسال إشعار" : "Send Push"}
                  </Link>
                  <Link href="/recipients" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "المستلمون" : "Recipients"}
                  </Link>
                  <Link href="/whatsapp" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "واتساب" : "WhatsApp"}
                  </Link>
                  <Link href="/settings" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "الإعدادات" : "Settings"}
                  </Link>
                  <div className="nav-menu-divider" />
                  <button
                    type="button"
                    onClick={logout}
                    className="nav-menu-item nav-menu-danger"
                  >
                    {lang === "ar" ? "خروج" : "Logout"}
                  </button>
                </>
              )}

              {loaded && !isAdmin && (
                <>
                  <div className="nav-menu-divider" />
                  <Link href="/login" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? "دخول" : "Login"}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Always visible: icons */}
        <div className="nav-links">
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
