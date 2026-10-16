"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";
import PushSubscribe from "./PushSubscribe";

export default function Nav() {
  const { lang, toggle } = useLang();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          {t(lang, "brand")}<span>.</span>
        </Link>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/recipes">{t(lang, "nav_recipes")}</Link>
          <Link href="/recipes/new" className="btn btn-primary">
            {t(lang, "nav_add")}
          </Link>
          <PushSubscribe />
          <button
            type="button"
            onClick={toggle}
            className="btn btn-ghost"
            style={{ fontFamily: "inherit" }}
          >
            🌐 {t(lang, "lang_toggle")}
          </button>
        </div>
      </div>
    </nav>
  );
}
