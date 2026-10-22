"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

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

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [pieces, setPieces] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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

      if (newPieces.every((val, i) => val === i)) {
        setIsSolved(true);
        setWon(true);
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

  return (
    <main style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "system-ui, sans-serif", padding: "1.5rem 1rem 120px 1rem", direction: isAr ? "rtl" : "ltr" }}>
      
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/recipes" style={{ color: "#8b949e", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              {isAr ? ar.puzzle.back : "← Back"}
            </Link>
            <button onClick={startGame} style={{ background: "#21262d", color: "#e6edf3", border: "1px solid #30363d", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              ⟳ {isAr ? ar.puzzle.newImage : "New Image"}
            </button>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              {isAr ? ar.puzzle.title1 : "Recipe "}<span style={{ color: "#ff6b4a" }}>{isAr ? ar.puzzle.title2 : "Puzzle"}</span>
            </h1>
            <p style={{ color: "#8b949e", fontSize: "13px", margin: "4px 0 0 0" }}>
              {isAr ? ar.puzzle.subtitle : "Swap pieces to reveal the image"}
            </p>
          </div>
        </div>

        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "16px", padding: "16px", position: "relative", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)" }}>
          
          <button 
            onClick={isSolved ? startGame : revealSolution} 
            style={{ 
              position: "absolute", top: "16px", insetInlineEnd: "16px", 
              background: isSolved ? "#3fb950" : "#21262d", 
              color: isSolved ? "#ffffff" : "#ff6b4a", 
              border: isSolved ? "1px solid #3fb950" : "1px solid #ff6b4a", 
              padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, 
              cursor: "pointer", transition: "all 0.15s", zIndex: 10 
            }}
          >
            {isSolved ? (isAr ? ar.puzzle.newGameBtn : "New Game") : (isAr ? ar.puzzle.revealBtn : "Reveal")}
          </button>

          {loading ? (
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", width: "100%", aspectRatio: "1 / 1", background: "#0d1117", borderRadius: "12px", padding: "4px", marginTop: "2rem", direction: "ltr" }}>
              {pieces.map((pieceId, index) => {
                const x = (pieceId % 3) * 50;
                const y = Math.floor(pieceId / 3) * 50;
                const isSelected = selectedIndex === index;

                return (
                  <div
                    key={index}
                    onClick={() => handlePieceClick(index)}
                    style={{
                      backgroundImage: `url(${recipe?.imageUrl})`,
                      backgroundSize: "300% 300%",
                      backgroundPosition: `${x}% ${y}%`,
                      borderRadius: "8px",
                      cursor: isSolved ? "default" : "pointer",
                      boxShadow: isSelected ? "inset 0 0 0 3px #ff6b4a" : "inset 0 0 0 1px rgba(255,255,255,0.05)",
                      opacity: isSelected ? 0.8 : 1,
                      transition: "all 0.15s",
                    }}
                  />
                );
              })}
            </div>
          )}

          {isSolved && recipe && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <Link href={`/recipes/${recipe.id}`} style={{ color: "#ff6b4a", fontSize: "16px", fontWeight: 600, textDecoration: "none" }}>
                {isAr ? (recipe.nameAr || recipe.name) : recipe.name}
              </Link>
            </div>
          )}
        </div>

      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(13, 17, 23, 0.85)", backdropFilter: "blur(16px)", borderTop: "1px solid #30363d", padding: "16px", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        {message && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 500, color: isSolved ? "#3fb950" : "#8b949e" }}>
            {isSolved ? "✅" : "ℹ️"} {message}
          </div>
        )}
      </div>

      {won && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "20px", padding: "40px", textAlign: "center", maxWidth: "400px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)", animation: "scaleIn 0.3s ease" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>{isAr ? ar.puzzle.modalPerfect : "Perfect!"}</h2>
            <p style={{ color: "#8b949e", fontSize: "15px", marginBottom: "24px", lineHeight: 1.5 }}>
              {isAr ? ar.puzzle.modalText : "You successfully solved the puzzle for "}
              <strong style={{ color: "#ffffff" }}>{recipe ? (isAr ? (recipe.nameAr || recipe.name) : recipe.name) : ""}</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setWon(false)} style={{ flex: 1, background: "#21262d", color: "#e6edf3", border: "1px solid #30363d", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                {isAr ? ar.puzzle.modalClose : "Close"}
              </button>
              <button onClick={startGame} style={{ flex: 1, background: "#ff6b4a", color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                {isAr ? ar.puzzle.newGameBtn : "New Game"}
              </button>
            </div>
          </div>
          <style>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}

    </main>
  );
}
