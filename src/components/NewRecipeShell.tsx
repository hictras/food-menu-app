"use client";

import { useLang } from "./LanguageProvider";
import { t } from "@/lib/i18n";

export default function NewRecipeShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  return (
    <>
      <div className="page-head">
        <h1>{t(lang, "new_title")}</h1>
      </div>
      <p className="page-sub">{t(lang, "new_sub")}</p>
      {children}
    </>
  );
}
