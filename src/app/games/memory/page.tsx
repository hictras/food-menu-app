"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";
import GameHeader from "@/components/GameHeader";
import { useGameStats } from "@/hooks/useGameStats";

type Card = { id: string; matchId: number; text: string; type: "recipe" | "ingredient" | "bonus"; };
type Recipe = { id: number; name: string; nameAr: string | null; ingredients: { name: string; nameAr: string | null }[]; };

export default function MemoryGamePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { stats, saveStats } = useGameStats("memory", { wins: 0, bestTime: 0, played: 0 });

  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [time, setTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  async function startGame() {
    setLoading(true);
    setIsWon(false);
    setFlipped([]);
    setMatched([]);
    setTime(0);
    setIsLocked(false);
    setCards([]);
    setMatched([]);
    setFlipped([]); // Clear cards immediately

    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      const validRecipes = (Array.isArray(data) ? data : []).filter((r: Recipe) => r.ingredients && r.ingredients.length > 0);

      if (validRecipes.length < 7) { setLoading(false); return; }
      const shuffledRecipes = validRecipes.sort(() => 0.5 - Math.random()).slice(0, 7);

      let newCards: Card[] = [];
      shuffledRecipes.forEach((r: Recipe, index: number) => {
        const recipeName = isAr ? (r.nameAr || r.name) : r.name;
        const ingName = isAr ? (r.ingredients[0].nameAr || r.ingredients[0].name) : r.ingredients[0].name;
        newCards.push({ id: `r-${index}`, matchId: index, text: recipeName, type: "recipe" });
        newCards.push({ id: `i-${index}`, matchId: index, text: ingName, type: "ingredient" });
      });
      newCards.push({ id: "bonus", matchId: 999, text: isAr ? ar.memory.bonus : "⭐ BONUS", type: "bonus" });
      newCards = newCards.sort(() => 0.5 - Math.random());
      
      setCards(newCards);
      setLoading(false);
    } catch (err) { setLoading(false); }
  }

  useEffect(() => { startGame(); }, [lang]);

  // Timer
  useEffect(() => {
    if (loading || isWon || showRules || matched.length === 0) return;
    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [loading, isWon, showRules, matched.length]);

  // Save Stats
  useEffect(() => {
    if (isWon) {
      saveStats((prev) => ({
        wins: (prev.wins || 0) + 1,
        bestTime: prev.bestTime === 0 ? Math.max(1, time) : Math.min(prev.bestTime, Math.max(1, time)),
        played: (prev.played || 0) + 1
      }));
    }
  }, [isWon]);

  function handleCardClick(index: number) {
    if (isLocked || isWon) return;
    if (flipped.includes(index) || matched.includes(index)) return;

    const card = cards[index];
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (card.type === "bonus") {
      setIsLocked(true);
      const allIndices = cards.map((_, i) => i);
      setMatched(allIndices);
      setFlipped([]);
      setTimeout(() => { 
        setIsWon(true); 
        setIsLocked(false); 
      }, 600); // Short delay so the player sees the board light up before the win screen
      return;
    }

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const card1 = cards[first];
      const card2 = cards[second];

      if (card1.matchId === card2.matchId && card1.type !== card2.type) {
        setMatched((prev) => {
          const next = [...prev, first, second];
          if (next.length === 14) {
            setTimeout(() => setIsWon(true), 500);
          }
          return next;
        });
        setFlipped([]);
      } else {
        setIsLocked(true);
        setTimeout(() => { setFlipped([]); setIsLocked(false); }, 800);
      }
    }
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.calendar.loading : "Loading..."}</div>;
  if (cards.length === 0) return <div className="container" style={{ padding: 40 }}>Not enough recipes to play.</div>;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", padding: 12, background: "var(--bg)", overflow: "hidden", position: "relative" }}>
      <Link href="/games" style={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, textDecoration: "none", color: "var(--ink)" }}>
        ✕ {isAr ? "خروج" : "Exit"}
      </Link>

      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
        <GameHeader
          title="Masterchef Memory"
          titleAr="ذاكرة الشيف"
          onNewGame={startGame}
          onShowRules={() => setShowRules(true)}
          score={stats.wins || 0}
          scoreLabel="WINS"
          extra={`${time}s`}
          extraLabel="TIME"
          best={`${stats.bestTime || 0}s`}
          bestLabel="BEST"
        />

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(5, 1fr)", gap: 8, minHeight: 0 }}>
          {cards.map((card, index) => {
            const isFlipped = flipped.includes(index) || matched.includes(index);
            const isMatched = matched.includes(index);
            const isBonus = card.type === "bonus";

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(index)}
                style={{
                  background: isMatched ? (isBonus ? "rgba(255, 215, 0, 0.15)" : "rgba(123, 160, 91, 0.15)") : (isFlipped ? "var(--surface-2)" : "var(--surface)"),
                  border: `1px solid ${isMatched ? (isBonus ? "#ffd700" : "var(--olive)") : (isFlipped ? "var(--accent)" : "var(--line)")}`,
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                  fontSize: "0.8rem", fontWeight: 600, padding: 4, cursor: isMatched ? "default" : "pointer",
                  color: isFlipped ? (isMatched ? (isBonus ? "#ffd700" : "var(--olive)") : "var(--accent)") : "transparent",
                  transition: "all 0.2s", userSelect: "none", wordBreak: "break-word", opacity: isMatched ? 0.6 : 1,
                }}
              >
                {isFlipped ? card.text : <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>🍽️</span>}
              </div>
            );
          })}
        </div>
      </div>

      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{isAr ? ar.memory.rulesTitle : "Game Rules"}</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: isAr ? ar.memory.rulesText : "<strong>Goal:</strong> Match every Recipe with its main Ingredient.<br><br><strong>How to play:</strong> Click on two cards. If they belong together, they turn green. If not, they flip back.<br><br><strong>⭐ Bonus Card:</strong> Find the golden Star to reveal the whole board for 5 seconds!" }} />
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>{isAr ? ar.memory.gotIt : "Got it"}</button>
          </div>
        </div>
      )}

      {isWon && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", margin: "0 0 8px 0" }}>{isAr ? ar.memory.winTitle : "🎉 You Win!"}</h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>{isAr ? ar.memory.winMsg : "You matched all the dishes."}</p>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)", marginBottom: 24 }}>{time}s</div>
            <button className="btn btn-primary" onClick={startGame} style={{ width: "100%" }}>{isAr ? ar.memory.playAgain : "Play Again"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
