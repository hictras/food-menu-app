"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";

export default function EditRecipeShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  return (
    <>
      <div style={{ margin: "24px 0" }}>
        <Link href="/" className="btn btn-ghost">{t(lang, "back")}</Link>
      </div>
      <div className="page-head">
        <h1>{t(lang, "edit_title")}</h1>
      </div>
      <p className="page-sub">{t(lang, "edit_sub")}</p>
      {children}
    </>
  );
}
