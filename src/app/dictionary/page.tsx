"use client";

import { GAME_DICT } from "@/lib/game-translations";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

export default function DictionaryPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const keys = Object.keys(GAME_DICT) as (keyof typeof GAME_DICT)[];

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-head">
        <h1>{isAr ? "قاموس الكلمات" : "Translation Dictionary"}</h1>
      </div>
      <p className="page-sub">
        {isAr ? "جميع الكلمات المستخدمة في المشروع" : "All words used across the project"}
      </p>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>Key</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>English</th>
              <th style={{ padding: 12, textAlign: "end", fontWeight: 600 }}>Arabic (العربية)</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 12, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {key}
                </td>
                <td style={{ padding: 12, color: "var(--ink)" }}>
                  {GAME_DICT[key].en}
                </td>
                <td style={{ padding: 12, textAlign: "end", color: "var(--accent)", fontFamily: "var(--font-ar)", direction: "rtl" }}>
                  {GAME_DICT[key].ar}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/game" className="btn btn-primary">
          {isAr ? "→ اذهب إلى اللعبة" : "→ Go to Game"}
        </Link>
      </div>
    </main>
  );
}
