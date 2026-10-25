"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";
import GameHeader from "@/components/GameHeader";
import { useGameStats } from "@/hooks/useGameStats";

type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
};

function shuffle(array: number[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function PuzzlePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { stats, saveStats } = useGameStats("puzzle", { solved: 0, played: 0 });

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [pieces, setPieces] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showRules, setShowRules] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  async function startGame() {
    setLoading(true);
    setIsSolved(false);
    setWon(false);
    setSelectedIndex(null);
    setMessage("");

    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();

      const validRecipes = data.filter((r: any) => r.imageUrl);

      if (validRecipes.length === 0) {
        setMessage(isAr ? ar.puzzle.msgNoImages : "No recipe images found.");
        setLoading(false);
        return;
      }

      const randomRecipe = validRecipes[Math.floor(Math.random() * validRecipes.length)];
      setRecipe(randomRecipe);

      let newPieces = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      do {
        newPieces = shuffle(newPieces);
      } while (newPieces.every((val, index) => val === index));

      setPieces(newPieces);
    } catch (err) {
      setMessage(isAr ? ar.puzzle.msgFailLoad : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    if (isSolved) {
      saveStats((prev) => ({
        solved: (prev.solved || 0) + (won ? 1 : 0),
        played: (prev.played || 0) + 1
      }));
    }
  }, [isSolved]);

  function playSound(type: "swap" | "win") {
    try {
      const audio = new Audio();
      if (type === "swap") {
        audio.src = "https://actions.google.com/sounds/v1/cartoon/pop.ogg";
      } else if (type === "win") {
        audio.src = "https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg";
      }
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  function handlePieceClick(index: number) {
    if (isSolved) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      const newPieces = [...pieces];
      const temp = newPieces[selectedIndex];
      newPieces[selectedIndex] = newPieces[index];
      newPieces[index] = temp;
      setPieces(newPieces);
      setSelectedIndex(null);
      playSound("swap");

      if (newPieces.every((val, i) => val === i)) {
        setIsSolved(true);
        setWon(true);
        playSound("win");
        setMessage(isAr ? ar.puzzle.msgPerfect : "Perfect! You solved the puzzle.");
      }
    }
  }

  function revealSolution() {
    if (isSolved) return;
    setIsSolved(true);
    setWon(false);
    setPieces([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    setMessage(isAr ? ar.puzzle.msgRevealed : "Solution revealed.");
  }

  function handleDragStart(e: React.PointerEvent, index: number) {
    if (isSolved) return;
    e.preventDefault();
    setDraggedIndex(index);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: React.PointerEvent) {
    if (!isDragging) return;
    e.preventDefault();
  }

  function handleDragEnd(e: React.PointerEvent) {
    if (!isDragging || draggedIndex === null) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    if (
      e.clientX >= boardRect.left && e.clientX <= boardRect.right &&
      e.clientY >= boardRect.top && e.clientY <= boardRect.bottom
    ) {
      const col = Math.floor((e.clientX - boardRect.left) / (boardRect.width / 3));
      const row = Math.floor((e.clientY - boardRect.top) / (boardRect.height / 3));
      const dropIndex = row * 3 + col;

      if (dropIndex >= 0 && dropIndex < 9 && dropIndex !== draggedIndex) {
        const newPieces = [...pieces];
        const temp = newPieces[draggedIndex];
        newPieces[draggedIndex] = newPieces[dropIndex];
        newPieces[dropIndex] = temp;
        setPieces(newPieces);

        if (newPieces.every((val, i) => val === i)) {
          setIsSolved(true);
          setWon(true);
          setMessage(isAr ? ar.puzzle.msgPerfect : "Perfect! You solved the puzzle.");
        }
      }
    }
    setDraggedIndex(null);
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", padding: 12, background: "var(--bg)", overflow: "hidden", position: "relative", direction: isAr ? "rtl" : "ltr" }}>
      <Link href="/games" style={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, textDecoration: "none", color: "var(--ink)" }}>
        ✕ {isAr ? "خروج" : "Exit"}
      </Link>

      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
        <GameHeader
          title="Recipe Puzzle"
          titleAr="لغز الوصفة"
          onNewGame={startGame}
          onShowRules={() => setShowRules(true)}
          best={`${stats.solved || 0} / ${stats.played || 0}`}
        />

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: 60 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px", padding: "16px", position: "relative", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)" }}>
            <button
              onClick={isSolved ? startGame : revealSolution}
              style={{ position: "absolute", top: "16px", insetInlineEnd: "16px", background: isSolved ? "var(--olive)" : "var(--surface-2)", color: isSolved ? "#ffffff" : "var(--accent)", border: `1px solid ${isSolved ? "var(--olive)" : "var(--accent)"}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", zIndex: 10 }}
            >
              {isSolved ? (isAr ? ar.puzzle.newGameBtn : "New Game") : (isAr ? ar.puzzle.revealBtn : "Reveal")}
            </button>

            {loading ? (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>
            ) : (
              <div ref={boardRef} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", width: "100%", aspectRatio: "1 / 1", background: "var(--bg)", borderRadius: "12px", padding: "4px", marginTop: "2rem", direction: "ltr", touchAction: "none", userSelect: "none" }}>
                {pieces.map((pieceId, index) => {
                  const x = (pieceId % 3) * 50;
                  const y = Math.floor(pieceId / 3) * 50;
                  const isSelected = selectedIndex === index;

                  return (
                    <div
                      key={index}
                      onPointerDown={(e) => handleDragStart(e, index)}
                      onPointerMove={handleDragMove}
                      onPointerUp={handleDragEnd}
                      onClick={() => { if (!isDragging) handlePieceClick(index); }}
                      style={{ backgroundImage: `url(${recipe?.imageUrl})`, backgroundSize: "300% 300%", backgroundPosition: `${x}% ${y}%`, borderRadius: "8px", cursor: isSolved ? "default" : "grab", boxShadow: draggedIndex === index ? "inset 0 0 0 3px var(--accent)" : isSelected ? "inset 0 0 0 3px var(--accent)" : "inset 0 0 0 1px rgba(255,255,255,0.05)", opacity: draggedIndex === index ? 0.3 : isSelected ? 0.8 : 1, transition: isDragging ? "none" : "all 0.15s", touchAction: "none" }}
                    />
                  );
                })}
              </div>
            )}

            {isSolved && recipe && (
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <Link href={`/recipes/${recipe.id}`} style={{ color: "var(--accent)", fontSize: "16px", fontWeight: 600, textDecoration: "none" }}>
                  {isAr ? recipe.nameAr || recipe.name : recipe.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div style={{ position: "fixed", bottom: 16, left: 16, right: 16, textAlign: "center", fontSize: "13px", fontWeight: 500, color: isSolved ? "var(--olive)" : "var(--muted)", pointerEvents: "none" }}>
          {isSolved ? "✅" : "ℹ️"} {message}
        </div>
      )}

      {won && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "20px", padding: "40px", textAlign: "center", maxWidth: "400px", width: "100%" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>{isAr ? ar.puzzle.modalPerfect : "Perfect!"}</h2>
            <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "24px", lineHeight: 1.5 }}>
              {isAr ? ar.puzzle.modalText : "You successfully solved the puzzle for "}
              <strong style={{ color: "var(--ink)" }}>{recipe ? (isAr ? recipe.nameAr || recipe.name : recipe.name) : ""}</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setWon(false)} style={{ flex: 1, background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--line)", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>{isAr ? ar.puzzle.modalClose : "Close"}</button>
              <button onClick={startGame} style={{ flex: 1, background: "var(--accent)", color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>{isAr ? ar.puzzle.newGameBtn : "New Game"}</button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{isAr ? "قواعد اللعبة" : "Game Rules"}</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }}>
              {isAr ? "اسحب القطع أو اضغط عليها لتبديل أماكنها. رتب الصورة كما كانت لتكسب." : "Drag or tap pieces to swap them. Arrange the image back to its original order to win."}
            </p>
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>{isAr ? "فهمت" : "Got it"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
