"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";
import PushSubscribe from "./PushSubscribe";

export default function Nav() {
  const { lang, toggle } = useLang();
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
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/recipes">{t(lang, "nav_recipes")}</Link>

          {loaded && isAdmin && (
            <>
              <Link href="/recipes/new" className="btn btn-primary">
                {t(lang, "nav_add")}
              </Link>
              <Link href="/admin" className="btn btn-ghost">
                {lang === "ar" ? "🔔 إشعار" : "🔔 Push"}
              </Link>
              <button type="button" onClick={logout} className="btn btn-ghost">
                {lang === "ar" ? "خروج" : "Logout"}
              </button>
            </>
          )}

          {loaded && !isAdmin && (
            <Link href="/login" className="btn btn-ghost">
              {lang === "ar" ? "دخول" : "Login"}
            </Link>
          )}

          <PushSubscribe />

          <button type="button" onClick={toggle} className="btn btn-ghost">
            🌐 {t(lang, "lang_toggle")}
          </button>
        </div>
      </div>
    </nav>
  );
}
