"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";
import { useTheme } from "./ThemeProvider";
import { t } from "@/lib/i18n";
import { ar } from "@/lib/ar";
import PushSubscribe from "./PushSubscribe";

export default function Nav() {
  const { lang, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function checkUnread() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!mounted) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const lastReadRaw = localStorage.getItem("last_read_inbox");
        const lastRead = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;

        const unread = data.filter((n) => {
          if (!n.createdAt) return false;
          return new Date(n.createdAt).getTime() > lastRead;
        });
        setUnreadCount(unread.length);
      } catch {}
    }
    checkUnread();
    const interval = setInterval(checkUnread, 60000);
    const onFocus = () => checkUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

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
    function close(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-admin-wrap")) setAdminOpen(false);
      if (!target.closest(".nav-mobile-wrap")) setMobileOpen(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAdminOpen(false);
        setMobileOpen(false);
      }
    }
    if (adminOpen || mobileOpen) {
      document.addEventListener("click", close);
      document.addEventListener("keydown", esc);
      return () => {
        document.removeEventListener("click", close);
        document.removeEventListener("keydown", esc);
      };
    }
  }, [adminOpen, mobileOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function closeAll() {
    setMobileOpen(false);
    setAdminOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="nav-inner" aria-label="Main navigation">
        <Link href="/" className="brand" aria-label="Home" onClick={closeAll}>
          {logoUrl ? (
            <img className="nav-logo" src={logoUrl} alt="Logo" />
          ) : (
            <span style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 400 }}>
              {t(lang, "brand")}<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          )}
        </Link>

        <Link href="/recipes" className="nav-link nav-recipes-main nav-mobile-only" onClick={closeAll}>
          {t(lang, "nav_recipes")}
        </Link>

        <div className="nav-center nav-desktop-only">
          <Link className="nav-link nav-recipes-main" href="/recipes" onClick={closeAll}>
            {t(lang, "nav_recipes")}
          </Link>

          <Link className="nav-link" href="/games" onClick={closeAll}>{lang === "ar" ? ar.nav.gamesHubNav : "Games"}</Link>

          <Link className="nav-link" href="/appearance" onClick={closeAll}>{lang === "ar" ? ar.appearance.title : "Appearance"}</Link>
          <Link className="nav-link" href="/calendar" onClick={closeAll}>
            {lang === "ar" ? ar.nav.calendar : "Calendar"}
          </Link>
          <Link className="nav-link" href="/week" onClick={closeAll}>
            {lang === "ar" ? ar.nav.week : "Week"}
          </Link>
          <Link className="nav-link" href="/inbox" onClick={closeAll} style={{ position: "relative" }}>
            {lang === "ar" ? ar.nav.inbox : "Inbox"}
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -8, background: "var(--accent)", color: "white", fontSize: 10, fontWeight: "bold", padding: "2px 6px", borderRadius: 999, lineHeight: 1 }}>
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        <div className="nav-actions">
          <PushSubscribe />

          {loaded && isAdmin && (
            <div className="nav-admin-wrap nav-desktop-only" style={{ position: "relative" }}>
              <button
                type="button"
                className="nav-icon-btn"
                onClick={() => setAdminOpen((v) => !v)}
                aria-label="Admin menu"
                aria-expanded={adminOpen}
                title="Admin"
              >
                ☰
              </button>

              {adminOpen && (
                <div className="nav-admin-menu">
                  <Link href="/admin/import" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? ar.nav.import : "Import recipes"}
                  </Link>
                  <Link href="/recipes/new" className="nav-menu-item" onClick={closeAll}>
                    ✚ {t(lang, "nav_add")}
                  </Link>
                  <Link href="/replies" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? ar.nav.replies : "Replies"}
                  </Link>
                  <Link href="/admin" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? ar.nav.sendPush : "Send Push"}
                  </Link>
                  <Link href="/inbox/admin" className="nav-menu-item" onClick={closeAll}>{lang === "ar" ? ar.inboxDetail.adminTitle : "Inbox Admin"}</Link>
                  <Link href="/hidden-recipes" className="nav-menu-item" onClick={closeAll}>
                    🙈 {lang === "ar" ? ar.hiddenRecipes.title : "Hidden Recipes"}
                  </Link>
                  <Link href="/visitors" className="nav-menu-item" onClick={closeAll}>
                    📱 {lang === "ar" ? ar.visitorsPage.title : "Devices Log"}
                  </Link>
                  <Link href="/recipients" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? ar.nav.recipients : "Recipients"}
                  </Link>
                  <Link href="/whatsapp" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? ar.nav.whatsapp : "WhatsApp"}
                  </Link>
                  <Link href="/settings" className="nav-menu-item" onClick={closeAll}>
                    {lang === "ar" ? ar.nav.settings : "Settings"}
                  </Link>
                  <Link href="/no-dish-today" className="nav-menu-item" onClick={closeAll}>
                    🍽 {lang === "ar" ? ar.nav.noDishPage : "No Dish page"}
                  </Link>
                  <div className="nav-menu-divider" />
                  <button type="button" onClick={logout} className="nav-menu-item nav-menu-danger">
                    {lang === "ar" ? ar.nav.logout : "Logout"}
                  </button>
                </div>
              )}
            </div>
          )}

          {loaded && !isAdmin && (
            <Link className="nav-login" href="/login" onClick={closeAll}>
              {lang === "ar" ? ar.nav.login : "Login"}
            </Link>
          )}

          <div className="nav-mobile-wrap">
            <button
              type="button"
              className="nav-menu-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="nav-mobile-menu"
            >
              <span className="menu-lines">{mobileOpen ? "×" : "☰"}</span>
            </button>
          </div>

        </div>

        <div className={`nav-mobile-menu${mobileOpen ? " is-open" : ""}`} id="nav-mobile-menu">
          <Link className="mobile-nav-link" href="/games" onClick={closeAll}>
            <span>🎮</span> {lang === "ar" ? ar.nav.gamesHubNav : "Games"}
          </Link>
          <Link className="mobile-nav-link" href="/appearance" onClick={closeAll}><span>🎨</span> {lang === "ar" ? ar.appearance.title : "Appearance"}</Link>
          <Link className="mobile-nav-link" href="/calendar" onClick={closeAll}>
            <span>📅</span> {lang === "ar" ? ar.nav.calendar : "Calendar"}
          </Link>
          <Link className="mobile-nav-link" href="/week" onClick={closeAll}>
            <span>📄</span> {lang === "ar" ? ar.nav.week : "This Week"}
          </Link>
          <Link className="mobile-nav-link" href="/inbox" onClick={closeAll} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
            <span>✉️</span> {lang === "ar" ? ar.nav.inbox : "Inbox"}
            {unreadCount > 0 && (
              <span style={{ background: "var(--accent)", color: "white", fontSize: 11, fontWeight: "bold", padding: "2px 6px", borderRadius: 999, marginInlineStart: "auto" }}>
                {unreadCount}
              </span>
            )}
          </Link>
          <div className="nav-menu-divider" />
          
          {loaded && isAdmin && (
            <>
              <Link className="mobile-nav-link" href="/admin/import" onClick={closeAll}>
                <span>📥</span> {lang === "ar" ? ar.nav.import : "Import"}
              </Link>
              <Link className="mobile-nav-link" href="/recipes/new" onClick={closeAll}>
                <span>✚</span> {t(lang, "nav_add")}
              </Link>
              <Link className="mobile-nav-link" href="/replies" onClick={closeAll}>
                <span>💬</span> {lang === "ar" ? ar.nav.replies : "Replies"}
              </Link>
              <Link className="mobile-nav-link" href="/admin" onClick={closeAll}>
                <span>📤</span> {lang === "ar" ? ar.nav.sendPush : "Send Push"}
              </Link>
              <Link className="mobile-nav-link" href="/inbox/admin" onClick={closeAll}>
                <span>📊</span> {lang === "ar" ? ar.inboxDetail.adminTitle : "Inbox Admin"}
              </Link>
              <Link className="mobile-nav-link" href="/hidden-recipes" onClick={closeAll}>
                <span>🙈</span> {lang === "ar" ? ar.hiddenRecipes.title : "Hidden Recipes"}
              </Link>
              <Link className="mobile-nav-link" href="/visitors" onClick={closeAll}>
                <span>📱</span> {lang === "ar" ? ar.visitorsPage.title : "Devices Log"}
              </Link>
              <Link className="mobile-nav-link" href="/recipients" onClick={closeAll}>
                <span>👥</span> {lang === "ar" ? ar.nav.recipients : "Recipients"}
              </Link>
              <Link className="mobile-nav-link" href="/whatsapp" onClick={closeAll}>
                <span>💬</span> {lang === "ar" ? ar.nav.whatsapp : "WhatsApp"}
              </Link>
              <Link className="mobile-nav-link" href="/settings" onClick={closeAll}>
                <span>⚙️</span> {lang === "ar" ? ar.nav.settings : "Settings"}
              </Link>
              <Link className="mobile-nav-link" href="/no-dish-today" onClick={closeAll}>
                <span>🍽</span> {lang === "ar" ? ar.nav.noDishPage : "No Dish page"}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="mobile-nav-link nav-menu-danger"
                style={{ border: "none", background: "transparent", textAlign: "start", width: "100%", cursor: "pointer" }}
              >
                <span>🚪</span> {lang === "ar" ? ar.nav.logout : "Logout"}
              </button>
            </>
          )}

          {loaded && !isAdmin && (
            <>
              <div className="nav-menu-divider" />
              <Link className="mobile-nav-link" href="/login" onClick={closeAll}>
                <span>👤</span> {lang === "ar" ? ar.nav.login : "Login"}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
