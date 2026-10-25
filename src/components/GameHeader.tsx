"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";

type Props = {
  title: string;
  titleAr: string;
  onNewGame: () => void;
  onShowRules: () => void;
  score?: number | string;
  best?: number | string;
};

export default function GameHeader({ title, titleAr, onNewGame, onShowRules, score, best }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      padding: "16px", 
      background: "var(--surface)", 
      borderBottom: "1px solid var(--line)",
      borderRadius: "0 0 16px 16px",
      marginBottom: "16px"
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Link href="/games" style={{ fontSize: "0.7rem", color: "var(--muted)", textDecoration: "none", fontWeight: 600 }}>
          ← {isAr ? "الألعاب" : "Games"}
        </Link>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: "1.5rem", margin: 0, lineHeight: 1 }}>
          {isAr ? titleAr : title}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onNewGame} style={{ fontSize: "0.7rem", padding: "4px 8px" }}>
            {isAr ? "↻ لعبة جديدة" : "↻ New Game"}
          </button>
          <button className="btn btn-ghost" onClick={onShowRules} style={{ fontSize: "0.7rem", padding: "4px 8px" }}>
            {isAr ? "? القواعد" : "? Rules"}
          </button>
        </div>
      </div>

      {(score !== undefined || best !== undefined) && (
        <div style={{ display: "flex", gap: 16, background: "var(--bg)", padding: "8px 16px", borderRadius: 12, border: "1px solid var(--line)" }}>
          {score !== undefined && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{isAr ? "النقاط" : "Score"}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)" }}>{score}</span>
            </div>
          )}
          {best !== undefined && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{isAr ? "الأفضل" : "Best"}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--olive)" }}>{best}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
